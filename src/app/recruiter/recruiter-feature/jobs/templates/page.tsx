"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Briefcase, FileText, MapPin, Calendar, DollarSign, Clock, Package, Tag, Rocket } from "lucide-react";

interface JobTemplate {
  id: number;
  title: string;
  category: string;
  description: string;
  address: string;
  yearsOfExperience: number;
  workModel: "Remote" | "Hybrid" | "Onsite";
  salaryRange: string;
  jobPackage: "BASIC" | "STANDARD" | "PREMIUM";
  expirationDate: string; // Will be calculated as 30 days from now
  skills: Array<{ id: number; name: string; mustToHave: boolean }>;
  reason: string;
  uses: number;
}

export default function JobTemplatesPage() {
  const router = useRouter();
  const [selectedTemplate, setSelectedTemplate] = useState<JobTemplate | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  // Calculate expiration date (30 days from now)
  const getExpirationDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date.toISOString().split('T')[0];
  };

  const templatesData: JobTemplate[] = [
    {
      id: 1,
      title: "Software Engineer (Full-Stack)",
      category: "Information Technology",
      description: `We are seeking a talented Full-Stack Software Engineer to join our dynamic team. You will be responsible for designing, developing, and maintaining scalable web applications using modern technologies.

Responsibilities:
• Build and maintain web applications end-to-end
• Collaborate with design, backend, and DevOps teams
• Write clean, maintainable, and testable code
• Participate in code reviews and technical discussions
• Optimize application performance and scalability

Requirements:
• 3+ years of experience in full-stack development
• Proficient in JavaScript/TypeScript, React, Node.js
• Familiar with RESTful APIs and cloud platforms (AWS/GCP)
• Strong problem-solving and communication skills
• Experience with Agile methodologies`,
      address: "Ho Chi Minh City, Vietnam",
      yearsOfExperience: 3,
      workModel: "Hybrid",
      salaryRange: "$1500 - $3000",
      jobPackage: "STANDARD",
      expirationDate: getExpirationDate(),
      skills: [
        { id: 1, name: "JavaScript", mustToHave: true },
        { id: 2, name: "React", mustToHave: true },
        { id: 3, name: "Node.js", mustToHave: true },
        { id: 4, name: "TypeScript", mustToHave: false },
        { id: 5, name: "AWS", mustToHave: false },
      ],
      reason: "Expanding development team for new projects",
      uses: 86,
    },
    {
      id: 2,
      title: "Software Engineer (Backend)",
      category: "Information Technology",
      description: `Join our backend team to develop and maintain robust, scalable backend services and APIs. You'll work with modern frameworks and cloud technologies.

Responsibilities:
• Design and implement scalable backend services
• Develop and maintain RESTful APIs
• Manage databases and optimize query performance
• Collaborate with frontend engineers and DevOps
• Ensure security and data protection best practices

Requirements:
• 2+ years of backend development experience
• Solid understanding of backend frameworks (Spring Boot, Express)
• Knowledge of SQL/NoSQL databases (PostgreSQL, MongoDB)
• Experience with CI/CD and containerization (Docker, Kubernetes)
• Strong understanding of software architecture patterns`,
      address: "Hanoi, Vietnam",
      yearsOfExperience: 2,
      workModel: "Onsite",
      salaryRange: "$1200 - $2500",
      jobPackage: "STANDARD",
      expirationDate: getExpirationDate(),
      skills: [
        { id: 6, name: "Java", mustToHave: true },
        { id: 7, name: "Spring Boot", mustToHave: true },
        { id: 8, name: "PostgreSQL", mustToHave: true },
        { id: 9, name: "Docker", mustToHave: false },
        { id: 10, name: "Redis", mustToHave: false },
      ],
      reason: "Building microservices architecture for our platform",
      uses: 73,
    },
    {
      id: 3,
      title: "Software Engineer (Frontend)",
      category: "Information Technology",
      description: `We're looking for a creative Frontend Engineer to build beautiful, responsive user interfaces that delight our users.

Responsibilities:
• Develop responsive, accessible UIs
• Integrate frontend with backend APIs
• Ensure cross-browser compatibility and performance
• Implement modern design systems
• Optimize web vitals and user experience

Requirements:
• 2+ years of frontend development experience
• Strong skills in React, Next.js, TypeScript
• Understanding of design systems and UX principles
• Experience with testing frameworks (Jest, Cypress)
• Knowledge of CSS frameworks (Tailwind, Material-UI)`,
      address: "Da Nang, Vietnam",
      yearsOfExperience: 2,
      workModel: "Remote",
      salaryRange: "$1000 - $2200",
      jobPackage: "BASIC",
      expirationDate: getExpirationDate(),
      skills: [
        { id: 2, name: "React", mustToHave: true },
        { id: 4, name: "TypeScript", mustToHave: true },
        { id: 11, name: "Next.js", mustToHave: true },
        { id: 12, name: "Tailwind CSS", mustToHave: false },
        { id: 13, name: "Jest", mustToHave: false },
      ],
      reason: "Enhancing our user interface and experience",
      uses: 54,
    },
    {
      id: 4,
      title: "Mobile Engineer (Flutter)",
      category: "Information Technology",
      description: `Join our mobile team to develop cross-platform mobile applications using Flutter. Build features that millions of users will love.

Responsibilities:
• Build cross-platform mobile applications with Flutter
• Integrate APIs and handle mobile data storage
• Optimize app performance and user experience
• Implement responsive designs for various screen sizes
• Collaborate with designers and backend engineers

Requirements:
• 2+ years of mobile development experience
• Strong experience with Flutter and Dart
• Knowledge of mobile UI/UX guidelines (iOS & Android)
• Familiarity with Firebase or mobile backend services
• Experience with CI/CD for mobile apps`,
      address: "Ho Chi Minh City, Vietnam",
      yearsOfExperience: 2,
      workModel: "Hybrid",
      salaryRange: "$1300 - $2800",
      jobPackage: "STANDARD",
      expirationDate: getExpirationDate(),
      skills: [
        { id: 14, name: "Flutter", mustToHave: true },
        { id: 15, name: "Dart", mustToHave: true },
        { id: 16, name: "Firebase", mustToHave: false },
        { id: 17, name: "REST API", mustToHave: true },
        { id: 18, name: "Git", mustToHave: false },
      ],
      reason: "Developing mobile version of our platform",
      uses: 41,
    },
    {
      id: 5,
      title: "DevOps Engineer",
      category: "Information Technology",
      description: `We're seeking a DevOps Engineer to automate deployments and ensure system reliability across all environments.

Responsibilities:
• Implement and maintain CI/CD pipelines
• Monitor system performance and uptime
• Manage cloud infrastructure (AWS, Azure, or GCP)
• Automate infrastructure provisioning and configuration
• Ensure security and compliance standards

Requirements:
• 3+ years of DevOps experience
• Experience with Docker, Kubernetes, Jenkins
• Strong scripting skills (Bash, Python)
• Knowledge of infrastructure as code (Terraform, Ansible)
• Understanding of networking and security best practices`,
      address: "Hanoi, Vietnam",
      yearsOfExperience: 3,
      workModel: "Onsite",
      salaryRange: "$1800 - $3500",
      jobPackage: "PREMIUM",
      expirationDate: getExpirationDate(),
      skills: [
        { id: 19, name: "Docker", mustToHave: true },
        { id: 20, name: "Kubernetes", mustToHave: true },
        { id: 21, name: "AWS", mustToHave: true },
        { id: 22, name: "Terraform", mustToHave: false },
        { id: 23, name: "Jenkins", mustToHave: false },
      ],
      reason: "Scaling infrastructure for rapid growth",
      uses: 37,
    },
    {
      id: 6,
      title: "AI / Machine Learning Engineer",
      category: "Information Technology",
      description: `Join our AI team to build and deploy machine learning models for production-grade applications. Work on cutting-edge ML projects.

Responsibilities:
• Develop ML pipelines for prediction and analysis
• Train, test, and deploy models efficiently
• Collaborate with data engineers and product teams
• Optimize model performance and accuracy
• Implement MLOps best practices

Requirements:
• 2+ years of ML engineering experience
• Proficient in Python, TensorFlow, or PyTorch
• Understanding of data preprocessing and ML algorithms
• Familiar with cloud ML tools (SageMaker, Vertex AI)
• Experience with model deployment and monitoring`,
      address: "Ho Chi Minh City, Vietnam",
      yearsOfExperience: 2,
      workModel: "Remote",
      salaryRange: "$2000 - $4000",
      jobPackage: "PREMIUM",
      expirationDate: getExpirationDate(),
      skills: [
        { id: 24, name: "Python", mustToHave: true },
        { id: 25, name: "TensorFlow", mustToHave: true },
        { id: 26, name: "Machine Learning", mustToHave: true },
        { id: 27, name: "PyTorch", mustToHave: false },
        { id: 28, name: "AWS SageMaker", mustToHave: false },
      ],
      reason: "Building AI-powered features for our platform",
      uses: 29,
    },
  ];

  // Filter templates
  const filteredTemplates = templatesData.filter(template => {
    const matchesSearch = searchQuery === "" || 
      template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.category.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = categoryFilter === "" || template.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  // Handle "Use Now" - navigate to active jobs page with template data
  const handleUseTemplate = (template: JobTemplate) => {
    // Store template data in sessionStorage
    sessionStorage.setItem('jobTemplate', JSON.stringify(template));
    // Navigate to active jobs page (will auto-open create modal with template data)
    router.push('/recruiter/recruiter-feature/jobs/active');
  };

  return (
    <div className="p-4 sm:p-0">
      {/* Header */}
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <FileText className="h-7 w-7 text-sky-600" />
          Job Templates
        </h1>
        <p className="text-sm text-gray-600 mt-1">Pre-filled job templates to create job postings quickly</p>
      </header>

      {/* Search & Filter */}
      <div className="mb-6 flex flex-col md:flex-row items-center gap-4 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="flex-1 w-full">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search template by title or category..."
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-sky-500 focus:border-sky-500 transition"
          />
        </div>
        <select 
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="w-full md:w-auto p-2 border border-gray-300 rounded-md focus:ring-sky-500 focus:border-sky-500 transition"
        >
          <option value="">All Categories</option>
          <option value="Information Technology">Information Technology</option>
          <option value="Marketing">Marketing</option>
          <option value="Finance">Finance / Accounting</option>
        </select>
      </div>

      {/* Template Cards */}
      {filteredTemplates.length === 0 ? (
        <div className="bg-white rounded-lg border p-8 text-center">
          <p className="text-gray-600">No templates found matching your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              className="bg-white p-6 rounded-lg border border-gray-200 shadow-md flex flex-col transition duration-300 hover:shadow-lg hover:border-sky-400"
            >
              {/* Category Badge */}
              <span className="text-xs font-medium text-sky-600 mb-2 uppercase tracking-wider">
                {template.category}
              </span>
              
              {/* Title */}
              <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-gray-600" />
                {template.title}
              </h2>
              
              {/* Quick Info */}
              <div className="space-y-2 mb-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  {template.address}
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-400" />
                  {template.yearsOfExperience} years experience
                </div>
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-gray-400" />
                  {template.workModel}
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-gray-400" />
                  {template.salaryRange}
                </div>
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-gray-400" />
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    template.jobPackage === 'PREMIUM' ? 'bg-purple-100 text-purple-800' :
                    template.jobPackage === 'STANDARD' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {template.jobPackage}
                  </span>
                </div>
              </div>

              {/* Skills Preview */}
              <div className="mb-4">
                <p className="text-xs text-gray-500 mb-2">Skills ({template.skills.length})</p>
                <div className="flex flex-wrap gap-1">
                  {template.skills.slice(0, 3).map((skill) => (
                    <span
                      key={skill.id}
                      className={`text-xs px-2 py-1 rounded ${
                        skill.mustToHave
                          ? 'bg-red-100 text-red-700'
                          : 'bg-green-100 text-green-700'
                      }`}
                    >
                      {skill.name}
                    </span>
                  ))}
                  {template.skills.length > 3 && (
                    <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                      +{template.skills.length - 3} more
                    </span>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-between items-center border-t pt-4 mt-auto">
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <Rocket className="h-3 w-3" />
                  {template.uses} uses
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedTemplate(template)}
                    className="px-3 py-1.5 text-sm text-sky-600 border border-sky-600 rounded-md hover:bg-sky-50 transition"
                  >
                    Preview
                  </button>
                  <button
                    onClick={() => handleUseTemplate(template)}
                    className="px-3 py-1.5 text-sm font-semibold text-white bg-green-500 rounded-md hover:bg-green-600 transition flex items-center gap-1"
                  >
                    <Rocket className="h-4 w-4" />
                    Use Now
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      {selectedTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 relative">
            <button
              onClick={() => setSelectedTemplate(null)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl"
              title="Close"
            >
              ✖
            </button>

            <h2 className="text-2xl font-bold text-gray-800 mb-2 pr-8">
              {selectedTemplate.title}
            </h2>
            <p className="text-sm text-sky-600 mb-6 uppercase tracking-wide">
              {selectedTemplate.category}
            </p>

            {/* Template Details */}
            <div className="space-y-4">
              {/* Description */}
              <div className="bg-gray-50 p-4 rounded-md">
                <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Description
                </h3>
                <div className="text-sm text-gray-700 whitespace-pre-line">
                  {selectedTemplate.description}
                </div>
              </div>

              {/* Job Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-3 rounded-md">
                  <p className="text-xs text-gray-600 mb-1">Address</p>
                  <p className="text-sm font-medium text-gray-900 flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {selectedTemplate.address}
                  </p>
                </div>
                <div className="bg-green-50 p-3 rounded-md">
                  <p className="text-xs text-gray-600 mb-1">Experience Required</p>
                  <p className="text-sm font-medium text-gray-900 flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {selectedTemplate.yearsOfExperience} years
                  </p>
                </div>
                <div className="bg-purple-50 p-3 rounded-md">
                  <p className="text-xs text-gray-600 mb-1">Work Model</p>
                  <p className="text-sm font-medium text-gray-900 flex items-center gap-1">
                    <Briefcase className="h-4 w-4" />
                    {selectedTemplate.workModel}
                  </p>
                </div>
                <div className="bg-amber-50 p-3 rounded-md">
                  <p className="text-xs text-gray-600 mb-1">Salary Range</p>
                  <p className="text-sm font-medium text-gray-900 flex items-center gap-1">
                    <DollarSign className="h-4 w-4" />
                    {selectedTemplate.salaryRange}
                  </p>
                </div>
                <div className="bg-sky-50 p-3 rounded-md">
                  <p className="text-xs text-gray-600 mb-1">Privilege</p>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    selectedTemplate.jobPackage === 'PREMIUM' ? 'bg-purple-100 text-purple-800' :
                    selectedTemplate.jobPackage === 'STANDARD' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {selectedTemplate.jobPackage}
                  </span>
                </div>
                <div className="bg-pink-50 p-3 rounded-md">
                  <p className="text-xs text-gray-600 mb-1">Expiration</p>
                  <p className="text-sm font-medium text-gray-900 flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    30 days
                  </p>
                </div>
              </div>

              {/* Skills */}
              <div className="bg-gray-50 p-4 rounded-md">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Required Skills
                </h3>
                <div className="flex flex-wrap gap-2">
                  {selectedTemplate.skills.map((skill) => (
                    <span
                      key={skill.id}
                      className={`text-sm px-3 py-1 rounded-full font-medium ${
                        skill.mustToHave
                          ? 'bg-red-100 text-red-700 border border-red-300'
                          : 'bg-green-100 text-green-700 border border-green-300'
                      }`}
                    >
                      {skill.name} {skill.mustToHave && '★'}
                    </span>
                  ))}
                </div>
              </div>

              {/* Reason */}
              <div className="bg-gray-50 p-4 rounded-md">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Reason for Posting</h3>
                <p className="text-sm text-gray-700">{selectedTemplate.reason}</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
              <button
                onClick={() => setSelectedTemplate(null)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md transition"
              >
                Close
              </button>
              <button
                onClick={() => {
                  handleUseTemplate(selectedTemplate);
                  setSelectedTemplate(null);
                }}
                className="px-6 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-md transition flex items-center gap-2"
              >
                <Rocket className="h-4 w-4" />
                Create Job from Template
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
