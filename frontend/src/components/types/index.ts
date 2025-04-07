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
  plant?      : { id : number; plantName : string; binomialName : string; description : string; };
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
  id              : number;
  plantName       : string;
  binomialName    : string;
  description     : string;
  sunRequirements : string;
  growingDays     : string;
  sowingMethod    : string;
  spreadDiameter  : string;
  rowSpacing      : string;
  height          : string;
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


export interface TaskSuggestionProps {
  id          : number;
  plant       : PlantProps;
  description : string;
  created     : string;
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


export interface ShareProfile {
  id          : number;
  username    : string;
  profileIcon : string;
}