'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import CVTemplateSelector from '@/components/cv/CVTemplateSelector';
import CVPreview from '@/components/cv/CVPreview';
// import CVEditForm from '@/components/cv/CVEditForm';
import { SAMPLE_CV_DATA, CV_TEMPLATES, type CVData } from '@/types/cv';
import { decodeCVTemplateData } from '@/lib/cv-template-navigation';
import { autoNormalizeCVData } from '@/lib/cv-data-normalizer';
import { getMyInvoice } from '@/lib/invoice-api';

// Helper function to normalize awards array to objects for CVPreview compatibility
// Kept for backward compatibility with localStorage data
const normalizeAwards = (awards: any[] | undefined): Array<{name: string; organization?: string; date?: string}> => {
  if (!awards || !Array.isArray(awards)) return [];
  return awards.map(a => {
    if (typeof a === 'string') {
      // Parse string format: "Name - Organization - Year"
      const parts = a.split(' - ');
      return {
        name: parts[0] || a,
        organization: parts[1] || '',
        date: parts[2] || ''
      };
    }
    if (typeof a === 'object' && a !== null) {
      return {
        name: a.name || '',
        organization: a.organization || '',
        date: a.year || a.month || a.date || ''
      };
    }
    return { name: String(a), organization: '', date: '' };
  });
};

export default function CVTemplatesPage() {
  const searchParams = useSearchParams();
  const [selectedTemplate, setSelectedTemplate] = useState('classic');
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [cvData, setCVData] = useState<CVData>(SAMPLE_CV_DATA);
  const [profileData, setProfileData] = useState<any>(null);
  const [currentPackage, setCurrentPackage] = useState<string>("FREE");

  // Fetch invoice to check package
  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const invoiceData = await getMyInvoice();
        setCurrentPackage(invoiceData?.packageName || "FREE");
      } catch (error: any) {
        if (error.message === 'NO_INVOICE_FOUND') {
          setCurrentPackage("FREE");
        }
      }
    };
    fetchInvoice();
  }, []);

  // Handle incoming data from query parameter (from cm-profile page)
  useEffect(() => {
    const dataParam = searchParams.get('data');
    
    if (dataParam) {
      // Decode the data parameter
      const decoded = decodeCVTemplateData(dataParam);
      
      if (decoded) {
        const { template, cvData: incomingCVData, profile } = decoded;
        
        console.log('Received data from cm-profile:', { template, cvData: incomingCVData, profile });
        
        // Set the template
        if (template) {
          setSelectedTemplate(template);
          try {
            localStorage.setItem('selectedTemplate', template);
          } catch (err) {
            // ignore
          }
        }
        
        // Set CV data
        if (incomingCVData) {
          // Normalize awards to strings for CVPreview compatibility
          // Also merge profile avatar into photoUrl as fallback
          const normalizedData = {
            ...incomingCVData,
            personalInfo: {
              ...incomingCVData.personalInfo,
              // Use cvData photoUrl first, then fallback to profile avatar
              photoUrl:
                incomingCVData.personalInfo?.photoUrl ||
                profile?.image || // candidate profile avatar
                profile?.photoUrl || 
                profile?.avatarUrl || 
                ""
            },
            awards: normalizeAwards(incomingCVData.awards),
          };
          setCVData(normalizedData);
          try {
            localStorage.setItem('cvData', JSON.stringify(normalizedData));
          } catch (err) {
            // ignore
          }
        }
        
        // Store profile data
        if (profile) {
          setProfileData(profile);
        }
        
        return; // Skip other initialization if we have data param
      }
    }
    
    // If no data param, restore from localStorage (or use 'classic' as default)
    try {
      const t = localStorage.getItem('selectedTemplate');
      if (t) {
        setSelectedTemplate(t);
      } else {
        // No saved template, ensure 'classic' is the default
        setSelectedTemplate('classic');
        localStorage.setItem('selectedTemplate', 'classic');
      }
    } catch (err) {
      // ignore
    }
  }, [searchParams]);

  // Load saved CV from localStorage on mount (fallback to SAMPLE_CV_DATA)
  // Only run if we don't have data from query parameter
  useEffect(() => {
    const dataParam = searchParams.get('data');
    if (dataParam) return; // Skip if we have query param data
    
    try {
      const raw = localStorage.getItem('cvData');
      if (raw) {
        // Parse the stored data
        const parsedData = JSON.parse(raw);
        
        // Check if parsedData is valid and contains essential CV properties
        if (parsedData && typeof parsedData === 'object' && parsedData.personalInfo) {
          // Auto-normalize the data to ensure CVData format compatibility
          // This handles data from cm-profile format or any legacy format
          const normalizedData = autoNormalizeCVData(parsedData);
          
          // Create a properly structured CV data object
          const loadedCVData: CVData = {
            // Start with our sample data as a base
            ...SAMPLE_CV_DATA,
            // Merge with normalized data
            ...normalizedData,
            // Ensure nested objects are properly merged
            personalInfo: {
              ...SAMPLE_CV_DATA.personalInfo,
              ...normalizedData.personalInfo
            },
            // For arrays, use normalized data or empty array if no data
            education: normalizedData.education?.length ? normalizedData.education : SAMPLE_CV_DATA.education,
            experience: normalizedData.experience?.length ? normalizedData.experience : SAMPLE_CV_DATA.experience,
            skills: normalizedData.skills?.length ? normalizedData.skills : SAMPLE_CV_DATA.skills,
            languages: normalizedData.languages?.length ? normalizedData.languages : SAMPLE_CV_DATA.languages,
            certifications: normalizedData.certifications?.length ? normalizedData.certifications : SAMPLE_CV_DATA.certifications,
            // For optional sections, use empty arrays instead of SAMPLE_CV_DATA fallback
            projects: normalizedData.projects?.length ? normalizedData.projects : [],
            softSkills: normalizedData.softSkills?.length ? normalizedData.softSkills : [],
            hobbies: normalizedData.hobbies?.length ? normalizedData.hobbies : [],
            references: normalizedData.references || SAMPLE_CV_DATA.references,
            awards: normalizedData.awards?.length ? normalizedData.awards : [],
          };
          
          console.log("Loaded and normalized CV data from localStorage:", loadedCVData);
          setCVData(loadedCVData);
        } else {
          console.warn("Invalid CV data structure in localStorage, using sample data");
        }
      } else {
        console.log("No saved CV data found, using sample data");
        // Optionally: fetch from API here and setCVData(fetchedData)
      }
    } catch (err) {
      console.error("Error loading CV data:", err);
      // ignore parse errors and keep SAMPLE_CV_DATA
    }
  }, [searchParams]);

  // Persist cvData to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('cvData', JSON.stringify(cvData));
    } catch (err) {
      // ignore storage errors
    }
  }, [cvData]);

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    
    // Get the saved CV data from localStorage
    let savedCVData: CVData | null = null;
    try {
      const raw = localStorage.getItem('cvData');
      if (raw) {
        savedCVData = JSON.parse(raw) as CVData;
      }
    } catch (err) {
      console.error("Error reading saved CV data:", err);
    }
    
    // Load the template's default data (use SAMPLE_CV_DATA)
    const template = CV_TEMPLATES.find((t) => t.id === templateId);
    const templateDefaultData = SAMPLE_CV_DATA;
    
    // If we have saved CV data, use it but keep the template format
    if (savedCVData && savedCVData.personalInfo) {
      // Keep user's personal data but use template's formatting and structure
      setCVData({
        ...templateDefaultData,
        // Override with user's personal data
        personalInfo: {
          ...templateDefaultData.personalInfo, // Keep template-specific formatting
          fullName: savedCVData.personalInfo.fullName,
          position: savedCVData.personalInfo.position,
          email: savedCVData.personalInfo.email,
          phone: savedCVData.personalInfo.phone,
          location: savedCVData.personalInfo.location,
          summary: savedCVData.personalInfo.summary,
          website: savedCVData.personalInfo.website,
          linkedin: savedCVData.personalInfo.linkedin,
          dob: savedCVData.personalInfo.dob,
          nationality: savedCVData.personalInfo.nationality,
          photoUrl: savedCVData.personalInfo.photoUrl,
        },
        education: savedCVData.education || templateDefaultData.education,
        experience: savedCVData.experience || templateDefaultData.experience,
        skills: savedCVData.skills || templateDefaultData.skills,
        languages: savedCVData.languages || templateDefaultData.languages,
        certifications: savedCVData.certifications || templateDefaultData.certifications,
        // For optional sections, use empty arrays instead of template fallback
        projects: savedCVData.projects?.length ? savedCVData.projects : [],
        softSkills: savedCVData.softSkills?.length ? savedCVData.softSkills : [],
        hobbies: savedCVData.hobbies?.length ? savedCVData.hobbies : [],
        references: savedCVData.references || templateDefaultData.references,
        awards: savedCVData.awards?.length ? savedCVData.awards : [],
      });
    } else {
      // No saved data, use template default data
      setCVData(templateDefaultData);
    }
    
    try {
      localStorage.setItem('selectedTemplate', templateId);
    } catch (err) {
      // ignore
    }
  };

  const handleEditClick = () => {
    setIsEditFormOpen(true);
  };

  const handleDataChange = (newData: CVData) => {
    setCVData(newData);
  };

  const handleCloseEditForm = () => {
    setIsEditFormOpen(false);
  };

  // Check if we have custom data from update-cvprofile
  const hasCustomData = Object.keys(cvData).length > 0 && 
    (cvData.personalInfo?.fullName !== SAMPLE_CV_DATA.personalInfo.fullName ||
     cvData.personalInfo?.email !== SAMPLE_CV_DATA.personalInfo.email ||
     cvData.personalInfo?.position !== SAMPLE_CV_DATA.personalInfo.position ||
     cvData.personalInfo?.summary !== SAMPLE_CV_DATA.personalInfo.summary);
     
  // Update the state if custom data is detected (useful for refresh button visibility)
  useEffect(() => {
    if (hasCustomData) {
      // Don't need to do anything specific here, just ensure the effect runs when hasCustomData changes
      console.log("Custom CV data detected");
    }
  }, [hasCustomData]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content - Full width without container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 h-screen">
        {/* Template Selector - Full height */}
        <div className="lg:col-span-1 h-full overflow-y-auto bg-white">
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center flex-col sm:flex-row gap-2">
            <h2 className="text-xl font-bold text-gray-800">Select Template</h2>
          </div>
          
          {/* Thông báo dữ liệu cá nhân */}
          {hasCustomData && (
            <div className="bg-green-50 border-l-4 border-green-500 text-green-800 p-4 my-2 mx-3">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                </svg>
                <div>
                  <p className="font-medium">Your profile data has been synced!</p>
                  {/* <p className="text-sm">CV đang hiển thị thông tin cá nhân thực của bạn.</p> */}
                </div>
              </div>
            </div>
          )}
          
          <CVTemplateSelector onTemplateSelect={handleTemplateSelect} />
        </div>

        {/* CV Preview - Full height */}
        <div className="lg:col-span-2 h-full overflow-y-auto bg-gray-100">
          <CVPreview 
            templateId={selectedTemplate} 
            cvData={cvData}
            onEditClick={handleEditClick}
            userPackage={currentPackage}
          />
        </div>
      </div>
    </div>
  );
}