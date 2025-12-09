// Auth Controller
const { supabase, supabaseAdmin } = require('../utils/supabaseClient');
const config = require('../config/config');

const authController = {
  // Register user
  register: async (req, res, next) => {
    try {
      console.log('Registration request received:', { 
        email: req.body.email, 
        hasPassword: !!req.body.password,
        full_name: req.body.full_name,
        phone: req.body.phone 
      });
      
      const { email, password, full_name, phone } = req.body;

      // Validation
      if (!email || !password) {
        console.error('Validation failed: Missing email or password');
        return res.status(400).json({
          success: false,
          error: {
            message: 'Email and password are required'
          }
        });
      }

      // Validate password strength (minimum 6 characters)
      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Password must be at least 6 characters long'
          }
        });
      }

      // Sign up user with Supabase Auth
      console.log('Attempting to sign up user with Supabase...');
      console.log('Supabase URL:', config.supabase.url ? 'Set' : 'MISSING');
      console.log('Supabase Anon Key:', config.supabase.anonKey ? 'Set' : 'MISSING');
      
      let authData;
      try {
        const signUpResult = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: full_name || null,
              phone: phone || null
            },
            emailRedirectTo: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/callback`
          }
        });

        authData = signUpResult.data;
        const authError = signUpResult.error;

        if (authError) {
          console.error('Supabase auth error:', authError);
          console.error('Error details:', JSON.stringify(authError, null, 2));
          
          // Handle specific Supabase errors
          let errorMessage = authError.message || 'Failed to create user';
          if (authError.status === 0 || authError.name === 'AuthRetryableFetchError') {
            errorMessage = 'Cannot connect to Supabase. Please check your Supabase configuration in .env file.';
          }
          
          return res.status(400).json({
            success: false,
            error: {
              message: errorMessage,
              details: process.env.NODE_ENV === 'development' ? authError : undefined
            }
          });
        }
        
        console.log('Supabase signup successful:', { userId: authData?.user?.id });

        // Handle user profile (trigger should create it automatically)
        if (authData?.user) {
          console.log('Waiting for trigger to create profile...', { userId: authData.user.id });
          
          // Wait a moment for the trigger to fire and create the profile
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Check if profile exists (should be created by trigger)
          let profileData;
          let retries = 3;
          
          while (retries > 0) {
            const { data: existingProfile, error: fetchError } = await supabaseAdmin
              .from('user_profiles')
              .select('*')
              .eq('id', authData.user.id)
              .single();

            if (existingProfile) {
              console.log('Profile found (created by trigger), updating with additional data...');
              profileData = existingProfile;
              
              // Update profile with any additional data if provided
              if (full_name || phone) {
                const { data: updatedProfile, error: updateError } = await supabaseAdmin
                  .from('user_profiles')
                  .update({
                    full_name: full_name || profileData.full_name,
                    phone: phone || profileData.phone
                  })
                  .eq('id', authData.user.id)
                  .select()
                  .single();
                
                if (!updateError && updatedProfile) {
                  profileData = updatedProfile;
                }
              }
              break;
            }
            
            // Profile doesn't exist yet, wait and retry
            retries--;
            if (retries > 0) {
              console.log(`Profile not found yet, retrying... (${retries} attempts left)`);
              await new Promise(resolve => setTimeout(resolve, 500));
            }
          }
          
          // If profile still doesn't exist, try to create it manually as fallback
          if (!profileData) {
            console.log('Profile not created by trigger, creating manually...');
            const { data: newProfile, error: profileError } = await supabaseAdmin
              .from('user_profiles')
              .insert({
                id: authData.user.id,
                email: authData.user.email,
                full_name: full_name || null,
                phone: phone || null,
                role: 'user'
              })
              .select()
              .single();

            if (profileError) {
              console.error('Manual profile creation also failed:', profileError);
              
              // If it's a unique constraint error, profile might have been created between checks
              if (profileError.message?.includes('duplicate key') || profileError.code === '23505') {
                // Try fetching one more time
                const { data: finalProfile } = await supabaseAdmin
                  .from('user_profiles')
                  .select('*')
                  .eq('id', authData.user.id)
                  .single();
                
                if (finalProfile) {
                  profileData = finalProfile;
                } else {
                  // Profile creation failed, but user exists - they can login and trigger will create it
                  return res.status(201).json({
                    success: true,
                    message: 'User registered successfully. Please log in to complete setup.',
                    data: {
                      user: {
                        id: authData.user.id,
                        email: authData.user.email,
                        full_name: full_name || null,
                        role: 'user'
                      },
                      session: authData.session ? {
                        access_token: authData.session.access_token,
                        refresh_token: authData.session.refresh_token,
                        expires_at: authData.session.expires_at
                      } : null,
                      requiresEmailConfirmation: !authData.session,
                      profilePending: true
                    }
                  });
                }
              } else {
                // Other error - don't delete user, let them try to login
                return res.status(201).json({
                  success: true,
                  message: 'User registered successfully. Profile will be created on first login.',
                  data: {
                    user: {
                      id: authData.user.id,
                      email: authData.user.email,
                      full_name: full_name || null,
                      role: 'user'
                    },
                    session: authData.session ? {
                      access_token: authData.session.access_token,
                      refresh_token: authData.session.refresh_token,
                      expires_at: authData.session.expires_at
                    } : null,
                    requiresEmailConfirmation: !authData.session,
                    profilePending: true
                  }
                });
              }
            } else {
              profileData = newProfile;
            }
          }
          
          console.log('User profile ready:', { profileId: profileData?.id });

          // Return user data with session if available
          console.log('Registration successful, sending response');
          return res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
              user: {
                id: authData.user.id,
                email: authData.user.email,
                full_name: profileData?.full_name || full_name || null,
                role: profileData?.role || 'user'
              },
              session: authData.session ? {
                access_token: authData.session.access_token,
                refresh_token: authData.session.refresh_token,
                expires_at: authData.session.expires_at
              } : null,
              // Note: Email confirmation may be required depending on Supabase settings
              requiresEmailConfirmation: !authData.session
            }
          });
        } else {
          console.log('User created but requires email confirmation');
          return res.status(201).json({
            success: true,
            message: 'Registration initiated. Please check your email to confirm your account.',
            data: {
              requiresEmailConfirmation: true
            }
          });
        }
      } catch (supabaseError) {
        console.error('Supabase connection error:', supabaseError);
        return res.status(500).json({
          success: false,
          error: {
            message: 'Failed to connect to Supabase. Please check your configuration.',
            details: process.env.NODE_ENV === 'development' ? supabaseError.message : undefined
          }
        });
      }
    } catch (error) {
      console.error('Registration error:', error);
      next(error);
    }
  },

  // Login user
  login: async (req, res, next) => {
    try {
      const { email, password } = req.body;

      // Validation
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Email and password are required'
          }
        });
      }

      // Sign in with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password
      });

      if (error) {
        console.error('Login error:', error.message);
        return res.status(401).json({
          success: false,
          error: {
            message: error.message || 'Invalid email or password'
          }
        });
      }

      // Check if session exists
      if (!data || !data.session) {
        console.error('Login error: No session returned from Supabase');
        return res.status(500).json({
          success: false,
          error: {
            message: 'Login failed - No session created. Please try again.'
          }
        });
      }

      // Check if user exists
      if (!data.user) {
        console.error('Login error: No user data returned from Supabase');
        return res.status(500).json({
          success: false,
          error: {
            message: 'Login failed - User data not found. Please try again.'
          }
        });
      }

      // Get user profile
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('user_profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      // Log profile error but don't fail login if profile doesn't exist
      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Profile fetch error (non-critical):', profileError.message);
      }

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: data.user.id,
            email: data.user.email,
            full_name: profile?.full_name || null,
            role: profile?.role || 'user',
            avatar_url: profile?.avatar_url || null
          },
          session: {
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
            expires_at: data.session.expires_at
          }
        }
      });
    } catch (error) {
      console.error('Login exception:', error);
      next(error);
    }
  },

  // Logout user (client-side should clear token, but we can invalidate if needed)
  logout: async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        // Supabase handles logout client-side, but we can acknowledge it
        await supabase.auth.signOut();
      }

      res.json({
        success: true,
        message: 'Logged out successfully'
      });
    } catch (error) {
      next(error);
    }
  },

  // Get current user
  getCurrentUser: async (req, res, next) => {
    try {
      // User is already attached by auth middleware
      const userId = req.userId;
      
      console.log('getCurrentUser called, userId:', userId);

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: {
            message: 'User not authenticated'
          }
        });
      }

      // Get user profile
      const { data: profile, error } = await supabaseAdmin
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
      }

      if (error || !profile) {
        return res.status(404).json({
          success: false,
          error: {
            message: 'User profile not found',
            details: error?.message || 'Profile does not exist'
          }
        });
      }

      res.json({
        success: true,
        data: {
          user: {
            id: profile.id,
            email: profile.email,
            full_name: profile.full_name,
            phone: profile.phone,
            role: profile.role,
            avatar_url: profile.avatar_url,
            created_at: profile.created_at
          }
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // Update user profile
  updateProfile: async (req, res, next) => {
    try {
      const userId = req.userId;
      const { full_name, phone, avatar_url } = req.body;

      // Update user profile
      const { data: profile, error } = await supabaseAdmin
        .from('user_profiles')
        .update({
          full_name: full_name || null,
          phone: phone || null,
          avatar_url: avatar_url || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: {
          user: {
            id: profile.id,
            email: profile.email,
            full_name: profile.full_name,
            phone: profile.phone,
            role: profile.role,
            avatar_url: profile.avatar_url,
            created_at: profile.created_at
          }
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // Refresh token
  refreshToken: async (req, res, next) => {
    try {
      const { refresh_token } = req.body;

      if (!refresh_token) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Refresh token is required'
          }
        });
      }

      // Refresh session with Supabase
      const { data, error } = await supabase.auth.refreshSession({
        refresh_token
      });

      if (error) {
        return res.status(401).json({
          success: false,
          error: {
            message: 'Invalid or expired refresh token'
          }
        });
      }

      res.json({
        success: true,
        message: 'Token refreshed successfully',
        data: {
          session: {
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
            expires_at: data.session.expires_at
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = authController;

