export interface Recruiter {
  recruiterId: number;
  accountId: number;
  email: string;
  username: string;
  avatarUrl?: string; // Personal avatar from Account
  companyName: string;
  website: string;
  logoUrl: string; // Company logo
  about: string;
  companyEmail: string;
  contactPerson: string;
  phoneNumber: string;
  companyAddress: string;
  accountStatus: string;
  accountRole: string;
  verificationStatus: string;
}

export interface RecruiterResponse {
  code: number;
  message: string;
  result: Recruiter[];
}
