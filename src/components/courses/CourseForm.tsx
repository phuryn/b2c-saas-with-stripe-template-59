
import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Course } from '@/types/course';

const courseSchema = z.object({
  name: z.string().min(2, { message: 'Course name must be at least 2 characters' }).max(100),
  description: z.string().optional(),
  criteria: z.string().optional(),
  skills: z.string().optional().transform((val) => 
    val ? val.split(',').map(skill => skill.trim()).filter(Boolean) : []
  )
});

type FormValues = z.infer<typeof courseSchema>;

interface CourseFormProps {
  course: Course | null;
  onSave: (data: Partial<Course>) => void;
  onCancel: () => void;
}

const CourseForm: React.FC<CourseFormProps> = ({ course, onSave, onCancel }) => {
  const form = useForm<FormValues>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      name: course?.name || '',
      description: course?.description || '',
      criteria: course?.criteria || '',
      skills: course?.skills ? course.skills.join(', ') : '',
    },
  });

  const onSubmit = (values: FormValues) => {
    onSave({
      name: values.name,
      description: values.description || null,
      criteria: values.criteria || null,
      skills: values.skills, // This is now correctly transformed to string[] by our schema
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Course Name*</FormLabel>
              <FormControl>
                <Input placeholder="Enter course name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Enter course description" 
                  {...field} 
                  value={field.value || ''}
                  rows={3}
                />
              </FormControl>
              <FormDescription>
                Provide a brief description of the course content and objectives.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="criteria"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Criteria</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Enter completion criteria" 
                  {...field} 
                  value={field.value || ''}
                  rows={3}
                />
              </FormControl>
              <FormDescription>
                Specify the criteria required to complete this course.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="skills"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Skills</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Enter skills, separated by commas" 
                  {...field} 
                  value={field.value || ''}
                />
              </FormControl>
              <FormDescription>
                Enter skills related to this course, separated by commas (e.g., "React, TypeScript, UI Design").
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">
            {course ? 'Update Course' : 'Create Course'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default CourseForm;
