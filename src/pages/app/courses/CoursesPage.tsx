
import React, { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { PlusCircle, Pencil, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import CourseForm from '@/components/courses/CourseForm';
import { useAuth } from '@/context/AuthContext';
import { Course } from '@/types/course';

const CoursesPage: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const isAdmin = user?.role === 'administrator';

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        throw error;
      }

      setCourses(data || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast({
        title: 'Failed to fetch courses',
        description: 'There was an error loading the courses. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewCourse = () => {
    setSelectedCourse(null);
    setIsDialogOpen(true);
  };

  const handleEditCourse = (course: Course) => {
    setSelectedCourse(course);
    setIsDialogOpen(true);
  };

  const handleDeleteCourse = async (course: Course) => {
    if (!isAdmin) return;
    
    if (confirm(`Are you sure you want to delete the course "${course.name}"?`)) {
      try {
        const { error } = await supabase
          .from('courses')
          .delete()
          .eq('id', course.id);

        if (error) {
          throw error;
        }

        toast({
          title: 'Course deleted',
          description: `"${course.name}" has been removed successfully.`,
        });

        fetchCourses();
      } catch (error) {
        console.error('Error deleting course:', error);
        toast({
          title: 'Failed to delete course',
          description: 'There was an error deleting the course. Please try again.',
          variant: 'destructive',
        });
      }
    }
  };

  const handleSaveCourse = async (formData: Partial<Course>) => {
    if (!isAdmin) return;
    
    try {
      let result;
      
      if (selectedCourse) {
        // Update existing course
        result = await supabase
          .from('courses')
          .update({
            name: formData.name,
            description: formData.description,
            criteria: formData.criteria,
            skills: formData.skills || []
          })
          .eq('id', selectedCourse.id)
          .select();
          
        if (result.error) throw result.error;
        
        toast({
          title: 'Course updated',
          description: 'Course has been updated successfully.',
        });
      } else {
        // Create new course
        result = await supabase
          .from('courses')
          .insert({
            name: formData.name || '',
            description: formData.description,
            criteria: formData.criteria,
            skills: formData.skills || [],
            created_by: user?.id || ''
          })
          .select();
          
        if (result.error) throw result.error;
        
        toast({
          title: 'Course created',
          description: 'New course has been added successfully.',
        });
      }
      
      setIsDialogOpen(false);
      fetchCourses();
    } catch (error) {
      console.error('Error saving course:', error);
      toast({
        title: 'Failed to save course',
        description: 'There was an error saving the course. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Courses</h1>
        {isAdmin && (
          <Button onClick={handleNewCourse}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Add Course
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center items-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : courses.length === 0 ? (
            <div className="text-center p-8 text-gray-500">
              No courses found. {isAdmin && 'Create your first course by clicking the "Add Course" button.'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Skills</TableHead>
                  {isAdmin && <TableHead className="w-[100px]">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {courses.map((course) => (
                  <TableRow key={course.id}>
                    <TableCell className="font-medium">{course.name}</TableCell>
                    <TableCell>{course.description}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {course.skills?.map((skill, index) => (
                          <Badge key={`${course.id}-skill-${index}`} variant="outline">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    {isAdmin && (
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditCourse(course)}
                            title="Edit course"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteCourse(course)}
                            title="Delete course"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Course Edit/Create Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {selectedCourse ? 'Edit Course' : 'Create New Course'}
            </DialogTitle>
          </DialogHeader>
          <CourseForm 
            course={selectedCourse}
            onSave={handleSaveCourse}
            onCancel={() => setIsDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CoursesPage;
