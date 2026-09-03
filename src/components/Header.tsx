'use client';

import { Menu, MapPin, ChevronDown, Search, X } from "lucide-react";
import { useLanguage } from '@/components/LanguageProvider';
import { translateCity } from '@/data/cities';

interface HeaderProps {
  setIsSidebarOpen: (value: boolean) => void;
  setIsLocationModalOpen: (value: boolean) => void;
  selectedLocation: string;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  handleSearch: (query: string) => void;
  clearSearch: () => void;
  CATEGORIES: string[];
  selectedCategory: string;
  setSelectedCategory: (value: string) => void;
}

export default function Header({
  setIsSidebarOpen,
  setIsLocationModalOpen,
  selectedLocation,
  searchQuery,
  setSearchQuery,
  handleSearch,
  clearSearch,
  CATEGORIES,
  selectedCategory,
  setSelectedCategory,
}: HeaderProps) {
  const { language, t } = useLanguage();

  // Get translated location name
  const getLocationDisplay = () => {
    if (selectedLocation === "All") {
      return t('header.allLocations');
    }
    return translateCity(selectedLocation, language);
  };

  return (
    <header 
      style={{ 
        backgroundColor: "#000000", 
        flexShrink: 0,
        padding: "12px 16px 8px 16px",
        maxWidth: "100%",
        boxSizing: "border-box",
        borderBottom: "1px solid #1a1a1a",
        zIndex: 20
      }}
    >
      <div 
        style={{ 
          display: "flex", 
          flexDirection: "column",
          gap: "12px",
          maxWidth: "600px",
          margin: "0 auto"
        }}
      >
        {/* Top Row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <button 
                onClick={() => setIsSidebarOpen(true)}
                style={{
                  backgroundColor: "transparent",
                  border: "none",
                  color: "#ffffff",
                  cursor: "pointer",
                  padding: "4px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "40px",
                  width: "40px",
                  lineHeight: 0
                }}
              >
                <Menu size={24} />
              </button>

              <div style={{ 
                cursor: "pointer", 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center",
                height: "40px"
              }}>
                <img 
                  src="/logo.png" 
                  alt="D Saing Logo" 
                  style={{ 
                    height: "42px", 
                    width: "auto", 
                    maxWidth: "200px",
                    objectFit: "contain",
                    display: "block"
                  }} 
                />
              </div>
            </div>

            {/* Location Button */}
            <button
              onClick={() => setIsLocationModalOpen(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                backgroundColor: "#121212",
                border: "1px solid #262626",
                borderRadius: "16px",
                padding: "6px 10px",
                color: "#ffffff",
                cursor: "pointer",
                maxWidth: "150px",
                height: "36px"
              }}
            >
              <MapPin size={14} style={{ color: "#ef4444", flexShrink: 0 }} />
              <span 
                style={{ 
                  fontSize: "12px", 
                  fontWeight: 500,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  color: selectedLocation === "All" ? "#FFD700" : "#ffffff"
                }}
              >
                {getLocationDisplay()}
              </span>
              <ChevronDown size={12} style={{ color: "#888888", flexShrink: 0 }} />
            </button>
          </div>

        {/* Search Box */}
        <div 
          style={{ 
            display: "flex", 
            alignItems: "center", 
            backgroundColor: "#121212", 
            border: "1px solid #262626",
            borderRadius: "20px",
            padding: "8px 14px",
            width: "100%",
            boxSizing: "border-box",
            position: "relative"
          }}
        >
          <Search size={16} style={{ color: "#737373", marginRight: "8px" }} />
          <input 
            type="text" 
            placeholder={t('header.searchPlaceholder').replace('{location}', getLocationDisplay())}
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            style={{ 
              backgroundColor: "transparent", 
              border: "none", 
              outline: "none", 
              color: "#ffffff", 
              fontSize: "13px",
              width: "100%"
            }}
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              style={{
                backgroundColor: "transparent",
                border: "none",
                color: "#888888",
                cursor: "pointer",
                padding: "4px"
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Categories */}
        <div 
          style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: "16px",
            overflowX: "auto",
            whiteSpace: "nowrap",
            paddingBottom: "6px",
            scrollbarWidth: "none",
            msOverflowStyle: "none"
          }}
        >
          {CATEGORIES.map((category) => {
            const isSelected = selectedCategory === category;
            return (
              <button
                key={category}
                onClick={() => {
                  setSelectedCategory(category);
                  clearSearch();
                }}
                style={{
                  backgroundColor: "transparent",
                  border: "none",
                  padding: "4px 2px",
                  color: isSelected ? "#ffffff" : "#888888",
                  fontWeight: isSelected ? "600" : "400",
                  fontSize: "13px",
                  cursor: "pointer",
                  flexShrink: 0,
                  borderBottom: isSelected ? "2px solid #ffffff" : "2px solid transparent",
                  transition: "all 0.2s ease"
                }}
              >
                {category}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}