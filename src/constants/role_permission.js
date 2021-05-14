const permissions = {
  CREATE_USER: "create_user",
  CREATE_ASSET: "create_asset"
};
const role_permissions = {
  super: [permissions.CREATE_USER, permissions.CREATE_ASSET],
  admin:[permissions.CREATE_ASSET],
  asset_manager:[permissions.CREATE_ASSET]
};
module.exports = {
  constants:permissions,
  role_permissions,
  checkPermission: (role, permissions) => {
    if (!role_permissions[role]) return false;
    for (permission of permissions) {
      if (role_permissions[role].indexOf(permission) == -1) {
        return false;
      }
    }
    return true;
  }
};
