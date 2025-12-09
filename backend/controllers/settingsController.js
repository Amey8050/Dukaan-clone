// Settings Controller
const { supabaseAdmin } = require('../utils/supabaseClient');

const settingsController = {
  // Get store settings
  getSettings: async (req, res, next) => {
    try {
      const { storeId } = req.params;

      // Verify store ownership
      const { data: store, error: storeError } = await supabaseAdmin
        .from('stores')
        .select('id, owner_id, settings')
        .eq('id', storeId)
        .single();

      if (storeError || !store) {
        return res.status(404).json({
          success: false,
          error: {
            message: 'Store not found'
          }
        });
      }

      if (store.owner_id !== req.userId) {
        return res.status(403).json({
          success: false,
          error: {
            message: 'Access denied'
          }
        });
      }

      res.json({
        success: true,
        data: {
          settings: store.settings || {}
        }
      });
    } catch (error) {
      console.error('Get Settings Error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to fetch settings',
          details: error.message
        }
      });
    }
  },

  // Update store settings
  updateSettings: async (req, res, next) => {
    try {
      const { storeId } = req.params;
      const { category, settings } = req.body;

      if (!category) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Settings category is required'
          }
        });
      }

      // Verify store ownership
      const { data: store, error: storeError } = await supabaseAdmin
        .from('stores')
        .select('id, owner_id, settings')
        .eq('id', storeId)
        .single();

      if (storeError || !store) {
        return res.status(404).json({
          success: false,
          error: {
            message: 'Store not found'
          }
        });
      }

      if (store.owner_id !== req.userId) {
        return res.status(403).json({
          success: false,
          error: {
            message: 'Access denied'
          }
        });
      }

      // Merge new settings with existing settings
      const currentSettings = store.settings || {};
      const updatedSettings = {
        ...currentSettings,
        [category]: {
          ...(currentSettings[category] || {}),
          ...settings,
          updated_at: new Date().toISOString()
        }
      };

      // Log the settings being saved for debugging
      console.log('Saving settings:', {
        category,
        settings,
        updatedSettings: JSON.stringify(updatedSettings, null, 2)
      });

      // Update store settings in Supabase
      const { data: updatedStore, error: updateError } = await supabaseAdmin
        .from('stores')
        .update({
          settings: updatedSettings,
          updated_at: new Date().toISOString()
        })
        .eq('id', storeId)
        .select('settings')
        .single();

      if (updateError) {
        console.error('Supabase update error:', updateError);
        throw updateError;
      }

      // Verify the settings were saved correctly
      console.log('Settings saved successfully:', {
        storeId,
        category,
        savedSettings: updatedStore.settings
      });

      res.json({
        success: true,
        message: 'Settings saved successfully',
        data: {
          settings: updatedStore.settings
        }
      });
    } catch (error) {
      console.error('Update Settings Error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to save settings',
          details: error.message
        }
      });
    }
  }
};

module.exports = settingsController;

