# Resume API Documentation

## Award Management API

Base URL: `/api/award`

### Data Types

```typescript
interface AwardData {
  resumeId: number;        // ID của resume
  name: string;            // Tên giải thưởng
  organization: string;    // Tổ chức trao giải
  getDate: string;         // Ngày nhận giải (format: "YYYY-MM-DD")
  description?: string;    // Mô tả giải thưởng (optional)
}

interface AwardResponse {
  id: number;
  resumeId: number;
  name: string;
  organization: string;
  getDate: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}
```

### Endpoints

#### 1. Add Award
**POST** `/api/award`

Thêm giải thưởng mới vào resume.

**Request Body:**
```json
{
  "resumeId": 0,
  "name": "string",
  "organization": "string",
  "getDate": "2025-10-25",
  "description": "string"
}
```

**Response:**
```json
{
  "id": 1,
  "resumeId": 0,
  "name": "Excellence Award",
  "organization": "FPT University",
  "getDate": "2025-10-25",
  "description": "Award for outstanding performance",
  "createdAt": "2025-10-25T10:00:00Z",
  "updatedAt": "2025-10-25T10:00:00Z"
}
```

**Usage Example:**
```typescript
import { addAward } from "@/lib/resume-api";

const handleAddAward = async () => {
  try {
    const awardData = {
      resumeId: 0,
      name: "Excellence Award",
      organization: "FPT University",
      getDate: "2025-10-25",
      description: "Award for outstanding performance"
    };
    
    const response = await addAward(awardData);
    console.log("Award added:", response);
    toast.success("Award added successfully!");
  } catch (error) {
    console.error("Error:", error);
    toast.error("Failed to add award");
  }
};
```

#### 2. Get Awards by Resume ID
**GET** `/api/award/{resumeId}`

Lấy danh sách tất cả giải thưởng của một resume.

**Response:**
```json
[
  {
    "id": 1,
    "resumeId": 0,
    "name": "Excellence Award",
    "organization": "FPT University",
    "getDate": "2025-10-25",
    "description": "Award for outstanding performance"
  }
]
```

**Usage Example:**
```typescript
import { getAwardsByResumeId } from "@/lib/resume-api";

const loadAwards = async (resumeId: number) => {
  try {
    const awards = await getAwardsByResumeId(resumeId);
    console.log("Awards:", awards);
  } catch (error) {
    console.error("Error loading awards:", error);
  }
};
```

#### 3. Update Award
**PUT** `/api/award/{id}`

Cập nhật thông tin giải thưởng.

**Request Body:**
```json
{
  "name": "Updated Award Name",
  "organization": "Updated Organization",
  "getDate": "2025-11-01",
  "description": "Updated description"
}
```

**Usage Example:**
```typescript
import { updateAward } from "@/lib/resume-api";

const handleUpdateAward = async (awardId: number) => {
  try {
    const updatedData = {
      name: "Updated Award Name",
      description: "New description"
    };
    
    const response = await updateAward(awardId, updatedData);
    toast.success("Award updated successfully!");
  } catch (error) {
    toast.error("Failed to update award");
  }
};
```

#### 4. Delete Award
**DELETE** `/api/award/{id}`

Xóa giải thưởng.

**Response:** Status 204 No Content

**Usage Example:**
```typescript
import { deleteAward } from "@/lib/resume-api";

const handleDeleteAward = async (awardId: number) => {
  try {
    await deleteAward(awardId);
    toast.success("Award deleted successfully!");
  } catch (error) {
    toast.error("Failed to delete award");
  }
};
```

## Implementation in CM Profile

File: `src/app/candidate/cm-profile/page.tsx`

### Features Implemented:

1. **Add Award with API Integration**
   - Form validation
   - API call to POST `/api/award`
   - Toast notifications for success/error
   - Form reset after successful submission

2. **Load Awards on Component Mount**
   - Fetch awards from API
   - Transform API data to display format
   - Handle loading errors gracefully

3. **Delete Award**
   - Confirmation via remove button
   - API call to DELETE `/api/award/{id}`
   - Remove from local state after successful deletion

### Key Functions:

```typescript
// Add award with API call
const handleSaveAward = async () => {
  const awardData: AwardData = {
    resumeId: 0,
    name: awardName,
    organization: awardOrg,
    getDate: `${awardYear}-${awardMonth}-25`,
    description: awardDesc || undefined
  };
  
  const response = await addAward(awardData);
  toast.success("Award added successfully!");
};

// Load awards on mount
useEffect(() => {
  const loadAwards = async () => {
    const awardsData = await getAwardsByResumeId(resumeId);
    setAwards(transformedAwards);
  };
  loadAwards();
}, []);

// Delete award
const handleRemoveAward = async (id: string) => {
  await deleteAward(Number(id));
  toast.success("Award removed successfully!");
};
```

### TODO:

- [ ] Get actual `resumeId` from user authentication context
- [ ] Add loading states during API calls
- [ ] Add edit functionality for existing awards
- [ ] Handle network errors and retry logic
- [ ] Add optimistic UI updates

