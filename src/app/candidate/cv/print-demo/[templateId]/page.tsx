import { notFound } from 'next/navigation';

// ========================================
// TYPES
// ========================================

interface CVData {
  // Personal Info
  fullName: string;
  title?: string;
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
  photoUrl?: string;
  
  // Summary
  summary?: string;
  
  // Experience
  experience?: Array<{
    position: string;
    company: string;
    period: string;
    description: string;
  }>;
  
  // Education
  education?: Array<{
    degree: string;
    institution: string;
    period: string;
    description?: string;
  }>;
  
  // Skills
  skills?: Array<{
    category: string;
    items: string[];
  }>;
  
  // Languages
  languages?: Array<{
    name: string;
    level: string;
  }>;
  
  // Additional sections
  certifications?: Array<{
    name: string;
    issuer: string;
    date: string;
  }>;
  
  projects?: Array<{
    name: string;
    description: string;
    period: string;
  }>;
  
  awards?: Array<{
    name: string;
    organization: string;
    date: string;
  }>;
}

// ========================================
// DATA FETCHING
// ========================================

function parseBase64Data(encodedData?: string): CVData | null {
  if (!encodedData) return null;
  
  try {
    const jsonString = Buffer.from(encodedData, 'base64').toString('utf-8');
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('Failed to parse CV data:', error);
    return null;
  }
}

async function getCVData(cvId: string): Promise<CVData | null> {
  try {
    // TODO: Replace with your actual API endpoint
    // Example API call:
    // const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/cv/${cvId}`, {
    //   cache: 'no-store', // Disable caching for dynamic data
    // });
    // if (!response.ok) return null;
    // return await response.json();
    
    // For now, return mock data
    // In production, this should fetch from your database using cvId
    return {
      fullName: "John Doe",
      title: "Senior Full Stack Developer",
      email: "john.doe@example.com",
      phone: "+1 (555) 123-4567",
      address: "San Francisco, CA",
      website: "https://johndoe.dev",
      summary: "Experienced full-stack developer with 8+ years of expertise in building scalable web applications. Proficient in React, Node.js, and cloud infrastructure. Passionate about clean code and agile methodologies.",
      experience: [
        {
          position: "Senior Full Stack Developer",
          company: "Tech Corp Inc.",
          period: "2020 - Present",
          description: "Led development of enterprise SaaS platform serving 10,000+ users. Architected microservices infrastructure using Node.js and React. Mentored team of 5 junior developers."
        },
        {
          position: "Full Stack Developer",
          company: "StartupXYZ",
          period: "2017 - 2020",
          description: "Developed customer-facing web applications using React and Express.js. Implemented CI/CD pipelines reducing deployment time by 60%. Collaborated with design team on UX improvements."
        },
        {
          position: "Junior Developer",
          company: "Digital Solutions Ltd",
          period: "2015 - 2017",
          description: "Built responsive web interfaces using HTML5, CSS3, and JavaScript. Participated in agile sprints and code reviews. Fixed bugs and improved application performance."
        }
      ],
      education: [
        {
          degree: "Bachelor of Computer Science",
          institution: "University of California, Berkeley",
          period: "2011 - 2015",
          description: "Graduated with honors. Focus on Software Engineering and AI."
        }
      ],
      skills: [
        {
          category: "Frontend",
          items: ["React", "Next.js", "TypeScript", "Tailwind CSS", "Vue.js"]
        },
        {
          category: "Backend",
          items: ["Node.js", "Express", "PostgreSQL", "MongoDB", "Redis"]
        },
        {
          category: "DevOps",
          items: ["Docker", "AWS", "CI/CD", "Kubernetes", "Terraform"]
        }
      ],
      languages: [
        { name: "English", level: "Native" },
        { name: "Spanish", level: "Professional" },
        { name: "French", level: "Basic" }
      ],
      certifications: [
        {
          name: "AWS Certified Solutions Architect",
          issuer: "Amazon Web Services",
          date: "2022"
        },
        {
          name: "Professional Scrum Master",
          issuer: "Scrum.org",
          date: "2021"
        }
      ]
    };
  } catch (error) {
    console.error('Error fetching CV data:', error);
    return null;
  }
}

// ========================================
// TEMPLATE COMPONENTS
// ========================================

function ClassicTemplate({ data }: { data: CVData }) {
  return (
    <div className="cv-page classic-template">
      {/* Header Section */}
      <header className="cv-header">
        <div className="header-content">
          <h1 className="cv-name">{data.fullName}</h1>
          {data.title && <p className="cv-title">{data.title}</p>}
          
          <div className="contact-info">
            {data.email && (
              <span className="contact-item">
                <strong>Email:</strong> {data.email}
              </span>
            )}
            {data.phone && (
              <span className="contact-item">
                <strong>Phone:</strong> {data.phone}
              </span>
            )}
            {data.address && (
              <span className="contact-item">
                <strong>Location:</strong> {data.address}
              </span>
            )}
            {data.website && (
              <span className="contact-item">
                <strong>Website:</strong> {data.website}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Summary Section */}
      {data.summary && (
        <section className="cv-section summary-section">
          <h2 className="section-title">Professional Summary</h2>
          <p className="summary-text">{data.summary}</p>
        </section>
      )}

      {/* Experience Section */}
      {data.experience && data.experience.length > 0 && (
        <section className="cv-section experience-section">
          <h2 className="section-title">Work Experience</h2>
          {data.experience.map((exp, index) => (
            <div key={index} className="experience-item">
              <div className="item-header">
                <h3 className="item-title">{exp.position}</h3>
                <span className="item-period">{exp.period}</span>
              </div>
              <p className="item-subtitle">{exp.company}</p>
              <p className="item-description">{exp.description}</p>
            </div>
          ))}
        </section>
      )}

      {/* Education Section */}
      {data.education && data.education.length > 0 && (
        <section className="cv-section education-section">
          <h2 className="section-title">Education</h2>
          {data.education.map((edu, index) => (
            <div key={index} className="education-item">
              <div className="item-header">
                <h3 className="item-title">{edu.degree}</h3>
                <span className="item-period">{edu.period}</span>
              </div>
              <p className="item-subtitle">{edu.institution}</p>
              {edu.description && <p className="item-description">{edu.description}</p>}
            </div>
          ))}
        </section>
      )}

      {/* Skills Section */}
      {data.skills && data.skills.length > 0 && (
        <section className="cv-section skills-section">
          <h2 className="section-title">Skills</h2>
          <div className="skills-grid">
            {data.skills.map((skillGroup, index) => (
              <div key={index} className="skill-group">
                <h3 className="skill-category">{skillGroup.category}</h3>
                <p className="skill-items">{skillGroup.items.join(' • ')}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Certifications Section */}
      {data.certifications && data.certifications.length > 0 && (
        <section className="cv-section certifications-section">
          <h2 className="section-title">Certifications</h2>
          {data.certifications.map((cert, index) => (
            <div key={index} className="certification-item">
              <h3 className="item-title">{cert.name}</h3>
              <p className="item-subtitle">{cert.issuer} • {cert.date}</p>
            </div>
          ))}
        </section>
      )}

      {/* Languages Section */}
      {data.languages && data.languages.length > 0 && (
        <section className="cv-section languages-section">
          <h2 className="section-title">Languages</h2>
          <div className="languages-grid">
            {data.languages.map((lang, index) => (
              <div key={index} className="language-item">
                <strong>{lang.name}:</strong> {lang.level}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function ModernTemplate({ data }: { data: CVData }) {
  return (
    <div className="cv-page modern-template">
      {/* Sidebar */}
      <aside className="cv-sidebar">
        {/* Photo */}
        {data.photoUrl && (
          <div className="photo-container">
            <img src={data.photoUrl} alt={data.fullName} className="profile-photo" />
          </div>
        )}

        {/* Contact Info */}
        <div className="sidebar-section">
          <h2 className="sidebar-title">Contact</h2>
          {data.email && <p className="sidebar-item">{data.email}</p>}
          {data.phone && <p className="sidebar-item">{data.phone}</p>}
          {data.address && <p className="sidebar-item">{data.address}</p>}
          {data.website && <p className="sidebar-item">{data.website}</p>}
        </div>

        {/* Skills */}
        {data.skills && data.skills.length > 0 && (
          <div className="sidebar-section">
            <h2 className="sidebar-title">Skills</h2>
            {data.skills.map((skillGroup, index) => (
              <div key={index} className="sidebar-skill-group">
                <h3 className="sidebar-skill-category">{skillGroup.category}</h3>
                {skillGroup.items.map((item, idx) => (
                  <p key={idx} className="sidebar-skill-item">{item}</p>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* Languages */}
        {data.languages && data.languages.length > 0 && (
          <div className="sidebar-section">
            <h2 className="sidebar-title">Languages</h2>
            {data.languages.map((lang, index) => (
              <div key={index} className="sidebar-language">
                <strong>{lang.name}</strong>
                <p>{lang.level}</p>
              </div>
            ))}
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="cv-main">
        {/* Header */}
        <header className="modern-header">
          <h1 className="cv-name">{data.fullName}</h1>
          {data.title && <p className="cv-title">{data.title}</p>}
        </header>

        {/* Summary */}
        {data.summary && (
          <section className="cv-section">
            <h2 className="section-title">About Me</h2>
            <p className="summary-text">{data.summary}</p>
          </section>
        )}

        {/* Experience */}
        {data.experience && data.experience.length > 0 && (
          <section className="cv-section">
            <h2 className="section-title">Experience</h2>
            {data.experience.map((exp, index) => (
              <div key={index} className="experience-item">
                <div className="item-header">
                  <h3 className="item-title">{exp.position}</h3>
                  <span className="item-period">{exp.period}</span>
                </div>
                <p className="item-subtitle">{exp.company}</p>
                <p className="item-description">{exp.description}</p>
              </div>
            ))}
          </section>
        )}

        {/* Education */}
        {data.education && data.education.length > 0 && (
          <section className="cv-section">
            <h2 className="section-title">Education</h2>
            {data.education.map((edu, index) => (
              <div key={index} className="education-item">
                <div className="item-header">
                  <h3 className="item-title">{edu.degree}</h3>
                  <span className="item-period">{edu.period}</span>
                </div>
                <p className="item-subtitle">{edu.institution}</p>
                {edu.description && <p className="item-description">{edu.description}</p>}
              </div>
            ))}
          </section>
        )}

        {/* Certifications */}
        {data.certifications && data.certifications.length > 0 && (
          <section className="cv-section">
            <h2 className="section-title">Certifications</h2>
            {data.certifications.map((cert, index) => (
              <div key={index} className="certification-item">
                <h3 className="item-title">{cert.name}</h3>
                <p className="item-subtitle">{cert.issuer} • {cert.date}</p>
              </div>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}

function VintageTemplate({ data }: { data: CVData }) {
  return (
    <div className="cv-page vintage-template">
      {/* Left Column */}
      <div className="vintage-left">
        {/* Header */}
        <header className="vintage-header">
          <h1 className="vintage-name">{data.fullName}</h1>
          {data.title && <p className="vintage-position">{data.title}</p>}
          {data.summary && <p className="vintage-summary">{data.summary}</p>}
        </header>

        {/* Work Experience */}
        {data.experience && data.experience.length > 0 && (
          <section className="vintage-section">
            <h2 className="vintage-section-title">Work Experience</h2>
            {data.experience.map((exp, index) => (
              <div key={index} className="vintage-experience-item">
                <div className="vintage-experience-header">
                  <span className="vintage-period">{exp.period}</span>
                  <div className="vintage-experience-content">
                    <h3 className="vintage-position-title">
                      {exp.position}{' '}
                      <span className="vintage-company">at {exp.company}</span>
                    </h3>
                  </div>
                </div>
                <p className="vintage-description">{exp.description}</p>
              </div>
            ))}
          </section>
        )}

        {/* Skills */}
        {data.skills && data.skills.length > 0 && (
          <section className="vintage-section">
            <h2 className="vintage-section-title">Skills</h2>
            {data.skills.map((skillGroup, index) => (
              <div key={index} className="vintage-skill-group">
                <h3 className="vintage-skill-category">{skillGroup.category}</h3>
                <p className="vintage-skill-items">{skillGroup.items.join(', ')}</p>
              </div>
            ))}
          </section>
        )}
      </div>

      {/* Right Column */}
      <div className="vintage-right">
        {/* Photo */}
        {data.photoUrl && (
          <div className="vintage-photo-container">
            <img src={data.photoUrl} alt={data.fullName} className="vintage-photo" />
          </div>
        )}

        {/* Contact Info */}
        <div className="vintage-contact">
          {data.phone && (
            <div className="vintage-contact-item">
              <span className="vintage-contact-icon">📞</span>
              <span className="vintage-contact-text">{data.phone}</span>
            </div>
          )}
          {data.email && (
            <div className="vintage-contact-item">
              <span className="vintage-contact-icon">✉️</span>
              <span className="vintage-contact-text">{data.email}</span>
            </div>
          )}
          {data.address && (
            <div className="vintage-contact-item">
              <span className="vintage-contact-icon">📍</span>
              <span className="vintage-contact-text">{data.address}</span>
            </div>
          )}
          {data.website && (
            <div className="vintage-contact-item">
              <span className="vintage-contact-icon">🌐</span>
              <span className="vintage-contact-text">{data.website}</span>
            </div>
          )}
        </div>

        {/* Education */}
        {data.education && data.education.length > 0 && (
          <section className="vintage-section">
            <h2 className="vintage-section-title">Education</h2>
            {data.education.map((edu, index) => (
              <div key={index} className="vintage-education-item">
                <h3 className="vintage-school">{edu.institution}</h3>
                <p className="vintage-degree">{edu.degree}</p>
                <div className="vintage-edu-details">
                  <span>{edu.period}</span>
                  {edu.description && <span>{edu.description}</span>}
                </div>
              </div>
            ))}
          </section>
        )}

        {/* Certifications */}
        {data.certifications && data.certifications.length > 0 && (
          <section className="vintage-section">
            <h2 className="vintage-section-title">Certifications</h2>
            {data.certifications.map((cert, index) => (
              <div key={index} className="vintage-cert-item">
                <p className="vintage-cert-name">{cert.name}</p>
                <p className="vintage-cert-issuer">{cert.issuer} • {cert.date}</p>
              </div>
            ))}
          </section>
        )}

        {/* Languages */}
        {data.languages && data.languages.length > 0 && (
          <section className="vintage-section">
            <h2 className="vintage-section-title">Languages</h2>
            {data.languages.map((lang, index) => (
              <div key={index} className="vintage-language-item">
                <span className="vintage-language-name">{lang.name}</span>
                <span className="vintage-language-level">({lang.level})</span>
              </div>
            ))}
          </section>
        )}

        {/* Awards */}
        {data.awards && data.awards.length > 0 && (
          <section className="vintage-section">
            <h2 className="vintage-section-title">Awards</h2>
            {data.awards.map((award, index) => (
              <div key={index} className="vintage-cert-item">
                <p className="vintage-cert-name">{award.name}</p>
                <p className="vintage-cert-issuer">{award.organization} • {award.date}</p>
              </div>
            ))}
          </section>
        )}
      </div>
    </div>
  );
}

function ProfessionalTemplate({ data }: { data: CVData }) {
  return (
    <div className="cv-page professional-template">
      {/* Header with accent */}
      <header className="professional-header">
        <div className="header-accent"></div>
        <div className="header-content">
          <h1 className="cv-name">{data.fullName}</h1>
          {data.title && <p className="cv-title">{data.title}</p>}
        </div>
      </header>

      {/* Contact bar */}
      <div className="contact-bar">
        {data.email && <span className="contact-item">{data.email}</span>}
        {data.phone && <span className="contact-item">{data.phone}</span>}
        {data.address && <span className="contact-item">{data.address}</span>}
        {data.website && <span className="contact-item">{data.website}</span>}
      </div>

      {/* Two-column layout */}
      <div className="professional-layout">
        {/* Left column */}
        <aside className="professional-sidebar">
          {/* Summary */}
          {data.summary && (
            <section className="sidebar-section">
              <h2 className="sidebar-title">Profile</h2>
              <p className="summary-text">{data.summary}</p>
            </section>
          )}

          {/* Skills */}
          {data.skills && data.skills.length > 0 && (
            <section className="sidebar-section">
              <h2 className="sidebar-title">Skills</h2>
              {data.skills.map((skillGroup, index) => (
                <div key={index} className="skill-group">
                  <h3 className="skill-category">{skillGroup.category}</h3>
                  <ul className="skill-list">
                    {skillGroup.items.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </section>
          )}

          {/* Languages */}
          {data.languages && data.languages.length > 0 && (
            <section className="sidebar-section">
              <h2 className="sidebar-title">Languages</h2>
              {data.languages.map((lang, index) => (
                <div key={index} className="language-item">
                  <strong>{lang.name}</strong>
                  <span>{lang.level}</span>
                </div>
              ))}
            </section>
          )}
        </aside>

        {/* Right column */}
        <main className="professional-main">
          {/* Experience */}
          {data.experience && data.experience.length > 0 && (
            <section className="cv-section">
              <h2 className="section-title">Professional Experience</h2>
              {data.experience.map((exp, index) => (
                <div key={index} className="experience-item">
                  <div className="item-header">
                    <div>
                      <h3 className="item-title">{exp.position}</h3>
                      <p className="item-subtitle">{exp.company}</p>
                    </div>
                    <span className="item-period">{exp.period}</span>
                  </div>
                  <p className="item-description">{exp.description}</p>
                </div>
              ))}
            </section>
          )}

          {/* Education */}
          {data.education && data.education.length > 0 && (
            <section className="cv-section">
              <h2 className="section-title">Education</h2>
              {data.education.map((edu, index) => (
                <div key={index} className="education-item">
                  <div className="item-header">
                    <div>
                      <h3 className="item-title">{edu.degree}</h3>
                      <p className="item-subtitle">{edu.institution}</p>
                    </div>
                    <span className="item-period">{edu.period}</span>
                  </div>
                  {edu.description && <p className="item-description">{edu.description}</p>}
                </div>
              ))}
            </section>
          )}

          {/* Certifications */}
          {data.certifications && data.certifications.length > 0 && (
            <section className="cv-section">
              <h2 className="section-title">Certifications</h2>
              <div className="certifications-grid">
                {data.certifications.map((cert, index) => (
                  <div key={index} className="certification-item">
                    <h3 className="item-title">{cert.name}</h3>
                    <p className="item-subtitle">{cert.issuer} • {cert.date}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}

// ========================================
// MAIN PAGE COMPONENT
// ========================================

export default async function PrintPage({
  params,
  searchParams,
}: {
  params: { templateId: string };
  searchParams: { id?: string; data?: string };
}) {
  const { templateId } = params;
  const { id: cvId, data: encodedData } = searchParams;

  // Template mapping: CVPreview ID -> Print template ID
  const templateMapping: Record<string, string> = {
    'minimalist': 'modern',    // Use modern as fallback for minimalist
    'classic': 'classic',
    'elegant': 'professional', // Use professional as fallback for elegant
    'vintage': 'vintage',
    'polished': 'professional', // Use professional as fallback for polished
    'modern': 'modern',
    'professional': 'professional',
  };

  const mappedTemplate = templateMapping[templateId] || 'modern';

  // Validate template
  const validTemplates = ['classic', 'modern', 'professional', 'vintage'];
  if (!validTemplates.includes(mappedTemplate)) {
    notFound();
  }

  // Get CV data from base64 param (priority) or fetch by ID
  let cvData: CVData | null = null;
  
  if (encodedData) {
    // Data passed directly via base64 (from PDF export)
    cvData = parseBase64Data(encodedData);
  } else if (cvId) {
    // Fetch data by ID (for direct browser access)
    cvData = await getCVData(cvId);
  }

  if (!cvData) {
    return (
      <div style={{ 
        padding: '40px', 
        fontFamily: 'Inter, sans-serif',
        textAlign: 'center',
        background: 'white',
        minHeight: '100vh'
      }}>
        <h1>CV Not Found</h1>
        <p>Unable to load CV data. Please check the CV ID and try again.</p>
      </div>
    );
  }

  // Render appropriate template
  return (
    <>
      {mappedTemplate === 'classic' && <ClassicTemplate data={cvData} />}
      {mappedTemplate === 'modern' && <ModernTemplate data={cvData} />}
      {mappedTemplate === 'professional' && <ProfessionalTemplate data={cvData} />}
      {mappedTemplate === 'vintage' && <VintageTemplate data={cvData} />}
    </>
  );
}

// ========================================
// METADATA
// ========================================

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: { templateId: string };
  searchParams: { id?: string };
}) {
  return {
    title: `CV Print - ${params.templateId}`,
    robots: 'noindex, nofollow', // Prevent indexing of print pages
  };
}
