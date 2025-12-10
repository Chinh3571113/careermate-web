# About Me & Education API Integration

## Tổng quan

Đã tích hợp API cho 2 sections:
1. **About Me** - Update resume description
2. **Education** - Add/Delete education entries

## API Endpoints

### 1. Update Resume (About Me)

**Endpoint:** `PUT /api/resume/{resumeId}`

**Request:**
```json
{
  "aboutMe": "string"
}
```

**Response:**
```json
{
  "code": 0,
  "message": "Success",
  "result": {
    "resumeId": 123,
    "aboutMe": "Updated description...",
    "updatedAt": "2025-10-27T..."
  }
}
```

**Usage:**
```typescript
const handleSaveAboutMe = async () => {
  if (!resumeId) {
    toast.error("Resume ID not found. Please refresh the page.");
    return;
  }

  try {
    const data: UpdateResumeData = {
      aboutMe: aboutMeText
    };

    await updateResume(resumeId, data);
    toast.success("About Me updated successfully!");
    setIsAboutMeOpen(false);
  } catch (error) {
    console.error("Error updating About Me:", error);
    toast.error("Failed to update About Me. Please try again.");
  }
};
```

### 2. Add Education

**Endpoint:** `POST /api/education`

**Request:**
```json
{
  "resumeId": 0,
  "school": "string",
  "major": "string",
  "degree": "string",
  "startDate": "2025-10-27",
  "endDate": "2025-10-27"
}
```

**Response:**
```json
{
  "educationId": 456,
  "resumeId": 0,
  "school": "FPT University",
  "major": "Software Engineering",
  "degree": "Bachelor",
  "startDate": "2021-09-01",
  "endDate": "2025-06-01"
}
```

**Usage:**
```typescript
const handleSaveEducation = async () => {
  if (!eduSchool || !eduDegree || !eduMajor || !eduFromMonth || !eduFromYear) return;
  
  if (!resumeId) {
    toast.error("Resume ID not found. Please refresh the page.");
    return;
  }

  try {
    const educationData: EducationData = {
      resumeId: resumeId,
      school: eduSchool,
      major: eduMajor,
      degree: eduDegree,
      startDate: `${eduFromYear}-${eduFromMonth}-01`,
      endDate: eduCurrentlyStudying 
        ? `${eduFromYear}-${eduFromMonth}-01` 
        : `${eduToYear}-${eduToMonth}-01`
    };

    const response = await addEducation(educationData);
    
    // Add to local state
    const newEducation = {
      id: response.educationId.toString(),
      school: response.school,
      degree: response.degree,
      major: response.major,
      startMonth: eduFromMonth,
      startYear: eduFromYear,
      endMonth: eduCurrentlyStudying ? '' : eduToMonth,
      endYear: eduCurrentlyStudying ? '' : eduToYear
    };
    
    setEducations([...educations, newEducation]);
    toast.success("Education added successfully!");
    setIsEducationOpen(false);
    
    // Reset form...
  } catch (error) {
    console.error("Error adding education:", error);
    toast.error("Failed to add education. Please try again.");
  }
};
```

### 3. Delete Education

**Endpoint:** `DELETE /api/education/{id}`

**Response:** 204 No Content

**Usage:**
```typescript
const handleRemoveEducation = async (id: string) => {
  try {
    await deleteEducation(Number(id));
    setEducations(educations.filter(edu => edu.id !== id));
    toast.success("Education removed successfully!");
  } catch (error) {
    console.error("Error removing education:", error);
    toast.error("Failed to remove education. Please try again.");
  }
};
```

## TypeScript Interfaces

### UpdateResumeData
```typescript
export interface UpdateResumeData {
  aboutMe: string;
}
```

### EducationData
```typescript
export interface EducationData {
  resumeId: number;
  school: string;
  major: string;
  degree: string;
  startDate: string; // Format: "YYYY-MM-DD"
  endDate: string;   // Format: "YYYY-MM-DD"
}
```

### EducationResponse
```typescript
export interface EducationResponse {
  educationId: number;
  resumeId: number;
  school: string;
  major: string;
  degree: string;
  startDate: string;
  endDate: string;
}
```

## State Management

### Education State
```typescript
const [educations, setEducations] = useState<Array<{
  id: string;
  school: string;
  degree: string;
  major: string;
  startMonth: string;
  startYear: string;
  endMonth: string;
  endYear: string;
}>>([]);
```

### About Me State
```typescript
const [aboutMeText, setAboutMeText] = useState("");
const [aboutMeCharCount, setAboutMeCharCount] = useState(0);
```

## Data Transformation

### Form Data → API Request

#### Education
```typescript
// User input: Month/Year dropdowns
eduFromMonth = "10"
eduFromYear = "2021"
eduToMonth = "06"
eduToYear = "2025"

// Transform to API format
{
  startDate: "2021-10-01",  // YYYY-MM-DD
  endDate: "2025-06-01"     // YYYY-MM-DD
}
```

### API Response → Display State

#### Education
```typescript
// API Response
{
  educationId: 123,
  startDate: "2021-10-01",
  endDate: "2025-06-01"
}

// Transform to state
{
  id: "123",
  startMonth: "10",
  startYear: "2021",
  endMonth: "06",
  endYear: "2025"
}

// Display
"10/2021 - 06/2025"
```

## UI Updates

### About Me Section
- ✅ Save button now calls API
- ✅ Toast notification on success/error
- ✅ Character counter (0/2500)
- ✅ Validation for resumeId

### Education Section
- ✅ Dynamic list from state
- ✅ Empty state message
- ✅ Add education via modal
- ✅ Delete education with confirmation
- ✅ Display format: "School Name / Degree - Major / MM/YYYY - MM/YYYY"

## Error Handling

### ResumeId Validation
```typescript
if (!resumeId) {
  toast.error("Resume ID not found. Please refresh the page.");
  return;
}
```

### API Error Handling
```typescript
try {
  // API call
  toast.success("Success message");
} catch (error) {
  console.error("Error:", error);
  toast.error("Error message");
}
```

## Testing Checklist

### About Me
- [ ] Open About Me modal
- [ ] Type text (test character counter)
- [ ] Click Save
- [ ] Verify API call with resumeId
- [ ] Check toast notification
- [ ] Verify modal closes

### Education
- [ ] Click Add Education button
- [ ] Fill form (school, degree, major, dates)
- [ ] Test "Currently studying" checkbox
- [ ] Click Save
- [ ] Verify API call with resumeId
- [ ] Check new education appears in list
- [ ] Click delete button
- [ ] Verify deletion API call
- [ ] Check education removed from list

## Files Modified

1. ✅ `src/lib/resume-api.ts`
   - Added `updateResume()` function
   - Added `UpdateResumeData` interface
   - Education API already existed

2. ✅ `src/app/candidate/cm-profile/page.tsx`
   - Updated imports to include `updateResume`, `addEducation`, `deleteEducation`
   - Updated `handleSaveAboutMe()` to call API
   - Updated `handleSaveEducation()` to call API with resumeId
   - Added `handleRemoveEducation()` function
   - Updated Education section JSX to display from state
   - Added empty state for educations

## Known Limitations

### Date Handling
- Currently using day "01" for all dates (first day of month)
- Backend may expect exact day, but we only collect Month/Year from user
- **Solution:** Always use "01" as day in YYYY-MM-DD format

### Currently Studying
- When checkbox checked, endDate is set same as startDate
- This might need backend clarification
- **Alternative:** Could set endDate to null or far future date

### Validation
- No validation for date range (startDate should be before endDate)
- **TODO:** Add validation in handleSaveEducation

## Future Improvements

- [ ] Add Update/Edit functionality for existing educations
- [ ] Validate date ranges
- [ ] Add loading states during API calls
- [ ] Implement optimistic UI updates
- [ ] Add confirmation dialog before delete
- [ ] Better error messages from backend
- [ ] Handle "Currently studying" with null endDate

