import { useNavigate } from 'react-router-dom';
import { UserMenu } from './UserMenu';

export const Header = () => {
  const navigate = useNavigate();

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16">
          <h1 
            className="text-lg sm:text-xl font-bold text-primary font-heading cursor-pointer transition-opacity duration-200 hover:opacity-80 active:opacity-70 touch-manipulation" 
            onClick={() => navigate('/dashboard')}
          >
            QLDT
          </h1>
          
          <div className="flex items-center gap-2 sm:gap-4">
            <UserMenu />
          </div>
        </div>
      </div>
    </header>
  );
};
