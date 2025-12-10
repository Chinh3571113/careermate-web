import { CVATSAnalyzeResponse } from '@/types/cv-ats';

const API_BASE_URL = process.env.NEXT_PUBLIC_PYTHON_API_URL || 'http://localhost:8000';

export async function analyzeCVATS(
  jobDescription: string,
  cvFile: File
): Promise<CVATSAnalyzeResponse> {
  const formData = new FormData();
  formData.append('job_description', jobDescription);
  formData.append('cv_file', cvFile);

  const response = await fetch(`${API_BASE_URL}/api/v1/cv/analyze-ats/`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to analyze CV: ${response.status} ${errorText}`);
  }

  return response.json();
}
