
import React, { useState, forwardRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Separator } from '@/components/ui/separator';

// Country code to country name mapping
const countryCodeToName: Record<string, string> = {
  'AF': 'Afghanistan',
  'AL': 'Albania',
  'DZ': 'Algeria',
  'AD': 'Andorra',
  'AO': 'Angola',
  'AG': 'Antigua and Barbuda',
  'AR': 'Argentina',
  'AM': 'Armenia',
  'AU': 'Australia',
  'AT': 'Austria',
  'AZ': 'Azerbaijan',
  'BS': 'Bahamas',
  'BH': 'Bahrain',
  'BD': 'Bangladesh',
  'BB': 'Barbados',
  'BY': 'Belarus',
  'BE': 'Belgium',
  'BZ': 'Belize',
  'BJ': 'Benin',
  'BT': 'Bhutan',
  'BO': 'Bolivia',
  'BA': 'Bosnia and Herzegovina',
  'BW': 'Botswana',
  'BR': 'Brazil',
  'BN': 'Brunei',
  'BG': 'Bulgaria',
  'BF': 'Burkina Faso',
  'BI': 'Burundi',
  'CV': 'Cabo Verde',
  'KH': 'Cambodia',
  'CM': 'Cameroon',
  'CA': 'Canada',
  'CF': 'Central African Republic',
  'TD': 'Chad',
  'CL': 'Chile',
  'CN': 'China',
  'CO': 'Colombia',
  'KM': 'Comoros',
  'CG': 'Congo',
  'CD': 'Congo, Democratic Republic of the',
  'CR': 'Costa Rica',
  'CI': 'Côte d\'Ivoire',
  'HR': 'Croatia',
  'CU': 'Cuba',
  'CY': 'Cyprus',
  'CZ': 'Czech Republic',
  'DK': 'Denmark',
  'DJ': 'Djibouti',
  'DM': 'Dominica',
  'DO': 'Dominican Republic',
  'EC': 'Ecuador',
  'EG': 'Egypt',
  'SV': 'El Salvador',
  'GQ': 'Equatorial Guinea',
  'ER': 'Eritrea',
  'EE': 'Estonia',
  'SZ': 'Eswatini',
  'ET': 'Ethiopia',
  'FJ': 'Fiji',
  'FI': 'Finland',
  'FR': 'France',
  'GA': 'Gabon',
  'GM': 'Gambia',
  'GE': 'Georgia',
  'DE': 'Germany',
  'GH': 'Ghana',
  'GR': 'Greece',
  'GD': 'Grenada',
  'GT': 'Guatemala',
  'GN': 'Guinea',
  'GW': 'Guinea-Bissau',
  'GY': 'Guyana',
  'HT': 'Haiti',
  'HN': 'Honduras',
  'HU': 'Hungary',
  'IS': 'Iceland',
  'IN': 'India',
  'ID': 'Indonesia',
  'IR': 'Iran',
  'IQ': 'Iraq',
  'IE': 'Ireland',
  'IL': 'Israel',
  'IT': 'Italy',
  'JM': 'Jamaica',
  'JP': 'Japan',
  'JO': 'Jordan',
  'KZ': 'Kazakhstan',
  'KE': 'Kenya',
  'KI': 'Kiribati',
  'KP': 'Korea, North',
  'KR': 'Korea, South',
  'KW': 'Kuwait',
  'KG': 'Kyrgyzstan',
  'LA': 'Laos',
  'LV': 'Latvia',
  'LB': 'Lebanon',
  'LS': 'Lesotho',
  'LR': 'Liberia',
  'LY': 'Libya',
  'LI': 'Liechtenstein',
  'LT': 'Lithuania',
  'LU': 'Luxembourg',
  'MG': 'Madagascar',
  'MW': 'Malawi',
  'MY': 'Malaysia',
  'MV': 'Maldives',
  'ML': 'Mali',
  'MT': 'Malta',
  'MH': 'Marshall Islands',
  'MR': 'Mauritania',
  'MU': 'Mauritius',
  'MX': 'Mexico',
  'FM': 'Micronesia',
  'MD': 'Moldova',
  'MC': 'Monaco',
  'MN': 'Mongolia',
  'ME': 'Montenegro',
  'MA': 'Morocco',
  'MZ': 'Mozambique',
  'MM': 'Myanmar',
  'NA': 'Namibia',
  'NR': 'Nauru',
  'NP': 'Nepal',
  'NL': 'Netherlands',
  'NZ': 'New Zealand',
  'NI': 'Nicaragua',
  'NE': 'Niger',
  'NG': 'Nigeria',
  'MK': 'North Macedonia',
  'NO': 'Norway',
  'OM': 'Oman',
  'PK': 'Pakistan',
  'PW': 'Palau',
  'PA': 'Panama',
  'PG': 'Papua New Guinea',
  'PY': 'Paraguay',
  'PE': 'Peru',
  'PH': 'Philippines',
  'PL': 'Poland',
  'PT': 'Portugal',
  'QA': 'Qatar',
  'RO': 'Romania',
  'RU': 'Russia',
  'RW': 'Rwanda',
  'KN': 'Saint Kitts and Nevis',
  'LC': 'Saint Lucia',
  'VC': 'Saint Vincent and the Grenadines',
  'WS': 'Samoa',
  'SM': 'San Marino',
  'ST': 'Sao Tome and Principe',
  'SA': 'Saudi Arabia',
  'SN': 'Senegal',
  'RS': 'Serbia',
  'SC': 'Seychelles',
  'SL': 'Sierra Leone',
  'SG': 'Singapore',
  'SK': 'Slovakia',
  'SI': 'Slovenia',
  'SB': 'Solomon Islands',
  'SO': 'Somalia',
  'ZA': 'South Africa',
  'SS': 'South Sudan',
  'ES': 'Spain',
  'LK': 'Sri Lanka',
  'SD': 'Sudan',
  'SR': 'Suriname',
  'SE': 'Sweden',
  'CH': 'Switzerland',
  'SY': 'Syria',
  'TW': 'Taiwan',
  'TJ': 'Tajikistan',
  'TZ': 'Tanzania',
  'TH': 'Thailand',
  'TL': 'Timor-Leste',
  'TG': 'Togo',
  'TO': 'Tonga',
  'TT': 'Trinidad and Tobago',
  'TN': 'Tunisia',
  'TR': 'Turkey',
  'TM': 'Turkmenistan',
  'TV': 'Tuvalu',
  'UG': 'Uganda',
  'UA': 'Ukraine',
  'AE': 'United Arab Emirates',
  'GB': 'United Kingdom',
  'US': 'United States',
  'UY': 'Uruguay',
  'UZ': 'Uzbekistan',
  'VU': 'Vanuatu',
  'VA': 'Vatican City',
  'VE': 'Venezuela',
  'VN': 'Vietnam',
  'YE': 'Yemen',
  'ZM': 'Zambia',
  'ZW': 'Zimbabwe'
};

interface BillingAddressProps {
  subscription: {
    subscribed: boolean;
    billing_address?: {
      line1?: string;
      line2?: string;
      city?: string;
      state?: string;
      postal_code?: string;
      country?: string;
      tax_id?: string;
      name?: string;
    } | null;
  } | null;
}

const BillingAddress = forwardRef<HTMLDivElement, BillingAddressProps>(({
  subscription: initialSubscription
}, ref) => {
  const [subscription, setSubscription] = useState(initialSubscription);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Debug logging for tax ID
  useEffect(() => {
    if (subscription?.billing_address) {
      console.log('Tax ID in billing address:', subscription.billing_address.tax_id);
      console.log('Customer name in billing address:', subscription.billing_address.name);
    }
  }, [subscription]);

  const openCustomerPortal = async () => {
    try {
      setLoading(true);
      // Simply call the customer portal without specifying a flow
      // The default portal gives access to all billing information settings
      const { data, error } = await supabase.functions.invoke('customer-portal');
      if (error) {
        console.error('Error opening customer portal:', error);
        throw new Error(error.message);
      }
      if (data?.url) {
        window.location.href = data.url;
      } else {
        console.error('No portal URL returned:', data);
        throw new Error("No portal URL returned");
      }
    } catch (err) {
      console.error('Error opening customer portal:', err);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to open customer portal'
      });
    } finally {
      setLoading(false);
    }
  };

  // Hide the component if the user doesn't have an active subscription
  if (!subscription?.subscribed) {
    return null;
  }

  // Log the billing address to see what we're getting from Supabase
  console.log('Billing address data:', subscription?.billing_address);

  // Format the address line with city, state, postal_code
  const formatAddressLine = () => {
    const addr = subscription?.billing_address;
    if (!addr) return null;

    const cityPart = addr.city || '';
    const statePart = addr.state || '';
    const postalPart = addr.postal_code || '';

    // Only add comma after city if state or postal code exists
    if (cityPart && (statePart || postalPart)) {
      return (
        <p>
          {cityPart}{(statePart || postalPart) ? ',' : ''} {statePart} {postalPart}
        </p>
      );
    } else if (cityPart) {
      return <p>{cityPart}</p>;
    } else if (statePart || postalPart) {
      return <p>{statePart} {postalPart}</p>;
    }
    return null;
  };

  // Convert country code to country name
  const getCountryName = (countryCode: string | undefined) => {
    if (!countryCode) return null;
    return countryCodeToName[countryCode] || countryCode;
  };

  return (
    <div className="space-y-4" ref={ref}>
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Billing Information</h3>
      </div>
      
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="text-center py-4">
              <div className="flex justify-center mb-2">
                <AlertTriangle className="h-8 w-8 text-amber-500" />
              </div>
              <p className="text-red-500 mb-4">{error}</p>
            </div>
          ) : subscription?.billing_address ? (
            <div className="space-y-4">
              {/* Display company/customer name prominently if available */}
              {subscription.billing_address.name && (
                <p className="font-medium text-base">{subscription.billing_address.name}</p>
              )}
              
              {/* Address without label */}
              <div>
                {subscription.billing_address.line1 && <p>{subscription.billing_address.line1}</p>}
                {subscription.billing_address.line2 && <p>{subscription.billing_address.line2}</p>}
                {formatAddressLine()}
                {subscription.billing_address.country && (
                  <p>{getCountryName(subscription.billing_address.country)}</p>
                )}
              </div>
              
              {/* Tax ID (if available) - with separator */}
              {subscription.billing_address.tax_id && (
                <>
                  <div className="pt-1">
                    <p>Tax ID: {subscription.billing_address.tax_id}</p>
                  </div>
                </>
              )}
              
              <div className="mt-4 pt-2">
                <Button variant="outline" onClick={openCustomerPortal} disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Edit Billing Information
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-500 mb-4">No billing information on file.</p>
              <Button variant="outline" onClick={openCustomerPortal} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Add Billing Information
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
});

BillingAddress.displayName = 'BillingAddress';
export default BillingAddress;
