export interface CityProps {
  country            : string;
  name               : string;
  precipitationClass : string;
}


export interface ProfileProps {
  profile: {
    id           : number;
    username     : string;
    firstName    : string;
    lastName     : string;
    email        : string;
    profileIcon  : string;
    displayTheme : string; 
    newChat      : boolean;
    visibility   : boolean;
    receiveMails : boolean;
    climate      : { country : string; name : string; precipitationClass : string; };
    created      : string;
  };

  updateProfile: (updatedProfile: ProfileProps['profile']) => void;
}


export interface MessageProps {
  id          : number;
  group?      : GroupProps;
  user?       : { id : number; username : string; profileIcon : string; };
  sender      : { id : number; username : string; profileIcon : string; };
  receiver?   : { id : number; username : string; profileIcon : string; };
  text        : string;
  task?       : { id : number; title : string; description : string; completed : boolean; created : string; }; 
  plant?      : PlantProps;
  files       : { id: number; file: string; created: string }[];
  unreadCount : number;
  created     : string;
}


export interface GroupProps {
  id          : number;
  groupIcon   : string;
  name        : string;
  description : string;
  admins      : { id : number; username : string; profileIcon : string; }[]; 
  members     : { id : number; username : string; profileIcon : string; }[]; 
  request     : { id : number; username : string; profileIcon : string; }[]; 
  autoJoin    : boolean;
  created     : string;
}

 
export interface PlantProps {
  id                  : number;
  commonName          : string;
  scientificName      : string;
  family              : string;
  width               : number;
  soilPH              : string[];
  height              : number;
  usdaHardinessZone   : string;
  waterRequirement    : | "Dry" | "Moist" | "Wet" | "Dry, Moist" | "Moist, Wet" | "Dry, Moist, Wet" | "Moist, Wet, Water" | "Wet, Water";
  lifeCycles          : string[];
  soilTypes           : string[];
  lightRequirements   : string[];
  utility             : string[];
  alternateNames      : string[];
  taskRecommendations : string;
  displayName?        : string;  
}


export interface TaskProps {
  id            : number;
  title         : string;
  description   : string;
  recurring     : boolean;
  recurringType : 'daily' | 'weekly' | 'monthly' | null; 
  completed     : boolean;
  scheduledTime : string;
  created       : string;
}


export interface PlantRank {
  rank          : number;
  name          : string;
  change        : '+' | '-' | '-';
  percentChange : string;  
}


export interface ModalProps {
  profile   : ProfileProps;
  isOpen    : boolean;
  onClose   : () => void;
  children? : React.ReactNode; 
}


export interface EmojiPickerProps {
  isOpen        : boolean;
  onEmojiSelect : ( emoji : string ) => void;
}


export interface MediaModalProps {
  profile       : ProfileProps;
  isOpen        : boolean;
  onClose       : () => void;
  onSendMessage : ( text: string, files: File[]) => void;
}


export interface BookmarkPayload {
  title   : string;
  context : string;
  type    : 'plantPair' | 'task';
}


export interface Bookmark { 
  id      : number; 
  title   : string; 
  context : string; type: 'plantPair' | 'task'; 
  created : string; 
};
 

export interface ShareProfile {
  id          : number;
  username    : string;
  profileIcon : string;
}


export const formatDate = (dateString: string): string => {
  const date  = new Date(dateString);
  const day   = date.getDate();
  const month = date.toLocaleString( 'en-US', { month: 'short' });
  const year  = date.getFullYear();
  return `${day} ${month}, ${year}`;
};


export const formatTaskDate = (dateString: string): string => {
  const date = new Date(dateString);
  const day   = date.getDate();
  const month = date.toLocaleString('en-US', { month: 'short' });
  const year  = date.getFullYear();

  let hours     = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const ampm    = hours >= 12 ? 'PM' : 'AM';
  hours         = hours % 12 || 12; 

  return `${day} ${month}, ${year}, ${hours}:${minutes} ${ampm}`;
};


export const getMessageFileFormat = (fileName: string): 'image' | 'video' | 'other' => {
  const extension = fileName.split('.').pop()?.toLowerCase();
  if      (['png', 'jpeg', 'jpg', 'gif'].includes(extension || '')) { return 'image'; }
  else if (['mp4', 'avi', 'mov'].includes(extension || '')) { return 'video'; }
  return 'other';
}


export const transformApiPlantData = (apiData: any): PlantProps => ({
  id                  : 0,  
  commonName          : apiData["Common name"] ?? "",
  scientificName      : apiData["Scientific name"] ?? "",
  family              : apiData["Family"] ?? "",
  height              : apiData["Height"] ?? 0,
  width               : apiData["Width"] ?? 0,
  soilPH              : apiData["Soil pH"] ?? "",
  usdaHardinessZone   : apiData["USDA Hardiness zone"] ?? "",
  waterRequirement    : apiData["Water requirement"] ?? "",
  lifeCycles          : (apiData["Life cycle"] ?? "").split(",").map((s: string) => s.trim()).filter(Boolean),
  soilTypes           : (apiData["Soil type"] ?? "").split(",").map((s: string) => s.trim()).filter(Boolean),
  lightRequirements   : (apiData["Light requirement"] ?? "").split(",").map((s: string) => s.trim()).filter(Boolean),
  utility             : (apiData["Utility"] ?? "").split(",").map((s: string) => s.trim()).filter(Boolean),
  alternateNames      : (apiData["Alternate name"] ?? "").split(",").map((s: string) => s.trim()).filter(Boolean),
  taskRecommendations : apiData["Task Recommendations."] ?? "",
  displayName         : apiData["displayName"] ?? "",
});