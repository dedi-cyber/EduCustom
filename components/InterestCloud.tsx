
import React from 'react';

interface InterestCloudProps {
  selectedInterests: string[];
  toggleInterest: (interest: string) => void;
}

const PREDEFINED_INTERESTS = [
  "Main Game (Gaming)", "Memasak", "Sepak Bola", "K-Pop / Musik", "Coding",
  "Anime / Gambar", "Traveling", "Fashion", "Tiktok / Social Media",
  "Astronomi", "Sains Eksperimen", "Menulis Cerita", "Catur", "Otomotif"
];

const InterestCloud: React.FC<InterestCloudProps> = ({ selectedInterests, toggleInterest }) => {
  return (
    <div className="flex flex-wrap gap-2 mt-4">
      {PREDEFINED_INTERESTS.map((interest) => {
        const isSelected = selectedInterests.includes(interest);
        return (
          <button
            key={interest}
            onClick={() => toggleInterest(interest)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border ${
              isSelected 
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md transform scale-105' 
                : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-400 hover:bg-indigo-50'
            }`}
          >
            {interest}
          </button>
        );
      })}
    </div>
  );
};

export default InterestCloud;
