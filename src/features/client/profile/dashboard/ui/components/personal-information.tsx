import Card from "@/components/ui/card";
import { useTab } from "@/components/ui/tabs";
import { BriefcaseBusiness, Mail } from "lucide-react";
import Image from "next/image";
import React from "react";
import { FaEnvelope} from "react-icons/fa";


const PersonalInformation = () => {
  const { activeTab, setActiveTab } = useTab();

  return (
    <Card>
      <div className="flex items-center">
        <div className="mr-4 w-16 h-16 rounded-full overflow-hidden">
          <Image
            src={require("./cv.png")}
            alt="avatar"
            className="object-cover w-full h-full shadow-lg"
          />
        </div>
        <div className="space-y-1">
          <div className="font-medium text-xl">Name</div>

          {/* Position */}
          <div className="flex items-center">
            <div className="flex mr-2 pt-1">
              <BriefcaseBusiness className="w-4 h-4 text-gray-400" />
            </div>
            <div className="flex-1 text-sm">fresher</div>
          </div>

          {/* Email */}
          <div className="flex items-center">
            <div className="flex mr-2 pt-1">
              <FaEnvelope className="w-4 h-4 text-gray-400 text-base" />
            </div>
            <div className="flex-1 text-sm">example@gmail.com</div>
          </div>

          {/* Update Button */}
          <button
            onClick={() => setActiveTab("profile")}
            className="text-blue-600 text-sm cursor-pointer hover:text-blue-800"
          >
            Update your profile
          </button>
        </div>
      </div>
    </Card>
  );
};

export default PersonalInformation;
