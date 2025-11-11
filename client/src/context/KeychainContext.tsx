import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { UserData, LoginResponse, VoteWitnessResponse } from '@/types/hive';
import { getUserData, getUserAccount } from '@/api/hive';
// Import Buffer shim to ensure Buffer is available
import '@/lib/buffer-shim';
// Type definitions are imported via the .d.ts file automatically

// Create a context for Keychain functionality
interface KeychainContextType {
  keychain: Window['hive_keychain'] | null;
  user: UserData | null;
  isLoggedIn: boolean;
  isKeychainInstalled: boolean;
  login: (username: string) => Promise<LoginResponse>;
  logout: () => void;
  voteWitness: (witness: string, approve: boolean) => Promise<VoteWitnessResponse>;
  setUser: (userData: UserData) => void;
  isDevelopmentMode: boolean;
  getSavedUsers: () => UserData[];
  switchUser: (username: string) => Promise<boolean>;
  removeUser: (username: string) => void;

}

// Create default context values
const defaultContextValue: KeychainContextType = {
  keychain: null,
  user: null,
  isLoggedIn: false,
  isKeychainInstalled: false,
  login: async () => ({ success: false, error: 'Context not initialized' }),
  logout: () => {},
  voteWitness: async () => ({ success: false, error: 'Context not initialized' }),
  setUser: () => {},
  isDevelopmentMode: false,
  getSavedUsers: () => [],
  switchUser: async () => false,
  removeUser: () => {}
};

// Create the context
const KeychainContext = createContext<KeychainContextType>(defaultContextValue);

// Provider component
export const KeychainProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [keychain, setKeychain] = useState<Window['hive_keychain'] | null>(null);
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isKeychainInstalled, setIsKeychainInstalled] = useState(false);
  
  // For development environment
  const isDevelopmentMode = import.meta.env.DEV || import.meta.env.MODE === 'development';
  const [useDevelopmentMode, setUseDevelopmentMode] = useState(isDevelopmentMode);
  


  // Load saved user data from localStorage if it exists
  // This is done on initial load and helps prevent unnecessary authentication
  useEffect(() => {
    let mounted = true; // Add mounted flag to prevent memory leaks

    const savedUser = localStorage.getItem('hive_current_user');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        console.log('Found saved user data in localStorage:', userData.username);

        if (mounted) {
          setUser(userData);
          setIsLoggedIn(true);
        }

        // Silently refresh user data in the background without requiring re-authentication
        // This ensures we have the latest data without disrupting the user experience
        if (userData.username) {
          getUserData(userData.username)
            .then(freshUserData => {
              // Only update if component is still mounted and there are meaningful differences
              if (mounted && freshUserData && JSON.stringify(userData) !== JSON.stringify(freshUserData)) {
                console.log('Updating user data with fresh data from API');
                setUser(freshUserData);
                try {
                  localStorage.setItem('hive_current_user', JSON.stringify(freshUserData));
                } catch (storageError) {
                  console.warn('Error saving fresh user data to localStorage:', storageError);
                }
              }
            })
            .catch(error => {
              if (mounted) {
                console.error('Background refresh of user data failed:', error);
              }
              // Keep using cached data on error
            });
        }
      } catch (error) {
        console.error('Error parsing saved user data:', error);
        localStorage.removeItem('hive_current_user');
      }
    }

    // Cleanup function to prevent setState on unmounted component
    return () => {
      mounted = false;
    };
  }, []);

  // Check if Keychain is installed
  useEffect(() => {
    const checkKeychain = () => {
      // Check if window.hive_keychain exists and is a valid object
      if (
        typeof window !== 'undefined' && 
        'hive_keychain' in window && 
        window.hive_keychain && 
        typeof window.hive_keychain === 'object' &&
        typeof window.hive_keychain.requestWitnessVote === 'function'
      ) {
        console.log('Hive Keychain extension detected and validated');
        setKeychain(window.hive_keychain);
        setIsKeychainInstalled(true);
        return true;
      } else {
        console.log('Hive Keychain extension not properly detected');
        return false;
      }
    };

    // First immediate check
    const initialCheck = checkKeychain();
    
    // If keychain not found initially, try a few more times with delay
    // Sometimes browser extensions take a moment to initialize
    if (!initialCheck) {
      let attempts = 0;
      const maxAttempts = 3;
      const checkInterval = setInterval(() => {
        attempts++;
        const found = checkKeychain();
        
        if (found || attempts >= maxAttempts) {
          clearInterval(checkInterval);
          
          // If still not found after all attempts and in development mode,
          // enable the development mode fallback
          if (!found && isDevelopmentMode) {
            console.log('Switching to development mode after failed keychain detection');
            setUseDevelopmentMode(true);
          }
        }
      }, 1000); // Check every second
      
      return () => {
        if (checkInterval) {
          clearInterval(checkInterval);
        }
      };
    }
    
    // No cleanup needed if initial check succeeded
    return undefined;
  }, [isDevelopmentMode]);

  // Track if a login is already in progress to avoid duplicate requests
  const [loginInProgress, setLoginInProgress] = useState(false);

  // Mock functions for development environment
  const mockLogin = async (username: string): Promise<LoginResponse> => {
    console.log('Development mode: Mock login called with username:', username);
    
    // In development mode, we still verify the account exists on the blockchain,
    // but we already did this check in the login function before calling mockLogin.
    // Just providing a successful mock response since we know the account exists.
    return { 
      success: true, 
      username,
      result: { username }
    };
  };

  const mockLogout = () => {
    console.log('Development mode: Mock logout called');
  };

  const mockVoteWitness = async (witness: string, approve: boolean): Promise<VoteWitnessResponse> => {
    console.log('Development mode: Mock vote witness called:', witness, approve);
    return { success: true };
  };

  // Real login implementation with strict username verification
  const login = async (username: string): Promise<LoginResponse> => {
    // Prevent duplicate login attempts
    if (loginInProgress) {
      return { success: false, error: 'Login already in progress' };
    }
    
    setLoginInProgress(true);
    
    try {
      // Remove any @ symbols and trim whitespace
      const cleanedUsername = username.replace('@', '').trim().toLowerCase();
      
      if (!cleanedUsername) {
        return { success: false, error: 'Username cannot be empty' };
      }
    
      // First check if the account exists on the Hive blockchain
      console.log('Checking if account exists on Hive blockchain:', cleanedUsername);
      const hiveAccount = await getUserAccount(cleanedUsername);
      
      if (!hiveAccount) {
        console.error('Account does not exist on Hive blockchain:', cleanedUsername);
        return {
          success: false,
          error: 'The account does not exist on the Hive blockchain'
        };
      }
      
      console.log('Account verified on Hive blockchain:', cleanedUsername);
      
      if (useDevelopmentMode) {
        // Use mock login in development mode
        const response = await mockLogin(cleanedUsername);
        
        if (response.success) {
          try {
            console.log('Development mode: Fetching user data for:', cleanedUsername);
            const userData = await getUserData(cleanedUsername);
            setUser(userData);
            
            // Save user data to localStorage for persistence
            localStorage.setItem('hive_current_user', JSON.stringify(userData));
            saveUserToHistory(userData);
          } catch (dataError) {
            const mode = useDevelopmentMode ? 'Development' : 'View-only';
            console.error(`${mode} mode: Error fetching user data:`, dataError);
            const userData = { username: cleanedUsername };
            setUser(userData);
            
            // Save minimal user data to localStorage
            localStorage.setItem('hive_current_user', JSON.stringify(userData));
            saveUserToHistory(userData);
          }
          setIsLoggedIn(true);
        }
        
        return response;
      }
      
      if (!isKeychainInstalled || !keychain) {
        return { success: false, error: 'Keychain not installed' };
      }

      // Proceed with login - keychain will validate account internally
      console.log('Attempting login with keychain:', cleanedUsername);
      
      const loginMessage = `Login to Aliento Witness Dashboard: ${new Date().toISOString()}`;
      
      const response = await new Promise<LoginResponse>((resolve) => {
        keychain.requestSignBuffer(
          cleanedUsername,
          loginMessage,
          'Posting',
          (keychainResponse) => {
            console.log('Keychain login response:', keychainResponse);
            if (keychainResponse.success) {
              resolve({ 
                success: true, 
                username: cleanedUsername,
                publicKey: keychainResponse.publicKey,
                result: keychainResponse 
              });
            } else {
              resolve({ 
                success: false, 
                error: keychainResponse.message || 'Unknown error' 
              });
            }
          }
        );
      });

      if (response.success) {
        try {
          console.log('Fetching complete user data for:', cleanedUsername);
          const userData = await getUserData(cleanedUsername);
          setUser(userData);
          setIsLoggedIn(true);
          
          // Save user data to localStorage for persistence across page reloads
          localStorage.setItem('hive_current_user', JSON.stringify(userData));
          saveUserToHistory(userData);
        } catch (dataError) {
          console.error('Error fetching user data:', dataError);
          // Set minimal user data if fetching complete data fails
          setUser({ username: cleanedUsername });
          setIsLoggedIn(true);
        }
      }
      
      return response;
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: String(error) };
    } finally {
      setLoginInProgress(false);
    }
  };

  // Logout function
  const logout = () => {
    if (useDevelopmentMode) {
      mockLogout();
    }
    
    // Clear user data from state
    setUser(null);
    setIsLoggedIn(false);
    
    // Remove saved user data from localStorage
    try {
      localStorage.removeItem('hive_current_user');
      console.log('User logged out, data cleared from localStorage');
    } catch (storageError) {
      console.warn('Error removing user data from localStorage:', storageError);
    }
  };

  // Vote witness implementation using direct Keychain API
  const voteWitness = async (witness: string, approve: boolean): Promise<VoteWitnessResponse> => {
    console.log('Vote witness called with parameters:', { witness, approve });
    console.log('Current state:', { 
      useDevelopmentMode, 
      isKeychainInstalled, 
      keychain: !!keychain, 
      isLoggedIn, 
      user: !!user 
    });
    
    // Check if real Keychain can be used
    if (!isKeychainInstalled || !keychain || !isLoggedIn || !user) {
      if (useDevelopmentMode) {
        console.log('Using development mode for voting');
        const response = await mockVoteWitness(witness, approve);
        
        // In development mode, update user data after voting
        if (response.success && user) {
          try {
            console.log('Development mode: Updating user data after witness vote');
            const userData = await getUserData(user.username);
            setUser(userData);
            
            // Update localStorage with the latest user data
            localStorage.setItem('hive_current_user', JSON.stringify(userData));
            saveUserToHistory(userData);
          } catch (dataError) {
            console.error('Development mode: Error updating user data after vote:', dataError);
          }
        }
        
        return response;
      } else {
        return { success: false, error: 'Not logged in or Keychain not available' };
      }
    }
    
    // At this point, we know we can use the real Keychain
    console.log('Using real Keychain for voting');
    
    try {
      console.log('Voting for witness:', witness, approve);
      
      const response = await new Promise<VoteWitnessResponse>((resolve) => {
        keychain!.requestWitnessVote(
          user.username,
          witness,
          approve,
          (keychainResponse) => {
            console.log('Keychain vote witness response:', keychainResponse);
            if (keychainResponse.success) {
              resolve({ success: true, result: keychainResponse });
            } else {
              resolve({ 
                success: false, 
                error: keychainResponse.message || 'Unknown error'
              });
            }
          }
        );
      });
      
      // Update user data after successful vote to refresh witness votes and free votes count
      if (response.success) {
        try {
          console.log('Updating user data after witness vote');
          const userData = await getUserData(user.username);
          setUser(userData);
          
          // Update localStorage with the latest user data after voting
          localStorage.setItem('hive_current_user', JSON.stringify(userData));
        } catch (dataError) {
          console.error('Error updating user data after vote:', dataError);
        }
      }
      
      return response;
    } catch (error) {
      console.error('Vote witness error:', error);
      return { success: false, error: String(error) };
    }
  };

  // Helper function to save user to history
  const saveUserToHistory = (userData: UserData) => {
    try {
      const savedUsers = getSavedUsers();
      const existingIndex = savedUsers.findIndex(u => u.username === userData.username);
      
      if (existingIndex >= 0) {
        // Update existing user data
        savedUsers[existingIndex] = userData;
      } else {
        // Add new user to the beginning of the list
        savedUsers.unshift(userData);
      }
      
      // Limit to 10 saved users
      const limitedUsers = savedUsers.slice(0, 10);
      localStorage.setItem('hive_saved_users', JSON.stringify(limitedUsers));
    } catch (error) {
      console.warn('Error saving user to history:', error);
    }
  };

  // Get all saved users from localStorage
  const getSavedUsers = (): UserData[] => {
    try {
      const savedUsers = localStorage.getItem('hive_saved_users');
      return savedUsers ? JSON.parse(savedUsers) : [];
    } catch (error) {
      console.warn('Error getting saved users:', error);
      return [];
    }
  };

  // Switch to a different user
  const switchUser = async (username: string): Promise<boolean> => {
    try {
      const savedUsers = getSavedUsers();
      const userData = savedUsers.find(u => u.username === username);
      
      if (userData) {
        // Use cached data first
        setUser(userData);
        setIsLoggedIn(true);
        localStorage.setItem('hive_current_user', JSON.stringify(userData));
        
        // Then refresh data in background
        try {
          const freshUserData = await getUserData(username);
          setUser(freshUserData);
          localStorage.setItem('hive_current_user', JSON.stringify(freshUserData));
          saveUserToHistory(freshUserData);
        } catch (error) {
          console.warn('Failed to refresh user data, using cached data:', error);
        }
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error switching user:', error);
      return false;
    }
  };

  // Remove a user from saved users
  const removeUser = (username: string) => {
    try {
      const savedUsers = getSavedUsers();
      const filteredUsers = savedUsers.filter(u => u.username !== username);
      localStorage.setItem('hive_saved_users', JSON.stringify(filteredUsers));
      
      console.log(`Removed user ${username} from saved accounts`);
      
      // If we're removing the current user, log them out
      if (user?.username === username) {
        console.log('Removing current user, logging out');
        logout();
      }
    } catch (error) {
      console.warn('Error removing user:', error);
    }
  };
  


  const contextValue: KeychainContextType = {
    keychain,
    user,
    isLoggedIn,
    // In development mode, we pretend the keychain is installed
    isKeychainInstalled: isKeychainInstalled || useDevelopmentMode,
    login,
    logout,
    voteWitness,
    setUser,
    isDevelopmentMode,
    getSavedUsers,
    switchUser,
    removeUser
  };

  return (
    <KeychainContext.Provider value={contextValue}>
      {children}
    </KeychainContext.Provider>
  );
};

// Custom hook to use the keychain context
export const useKeychain = (): KeychainContextType => {
  const context = useContext(KeychainContext);
  if (!context) {
    throw new Error('useKeychain must be used within a KeychainProvider');
  }
  return context;
};