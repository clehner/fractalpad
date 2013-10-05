/*jshint unused: false */
function validate(doc, oldDoc, userCtx, secObj) {
	//var ddoc = this;

	var admins = secObj.admins || false;

	var isLoggedIn = (userCtx.name !== null);
	var isAdmin = ~ userCtx.roles.indexOf("_admin") ||
		(admins.names && ~ admins.names.indexOf(userCtx.name)) ||
		(admins.roles && admins.roles.some(function (role) {
			return ~ userCtx.roles.indexOf(role);
		}));

	if (doc.type == "tile") {

		if (!/^[^_]+_[a-z0-9\-+]+_[a-z0-9\-+]+$/i.test(doc._id)) {
			throw {forbidden: "Tile id must be in the form prefix_count_count"};
		}

		if (doc._deleted) {
			throw {unauthorized: "Only admin can delete tile documents"};
		}

		if (!doc._attachments || !doc._attachments["tile.png"]) {
			throw {forbidden: "Document must have a tile image"};
		}

		if (doc._attachments["tile.png"].content_type != "image/png") {
			throw {forbidden: "Tile image must be png"};
		}

	} else {
		throw {forbidden: "Unknown document type"};
	}

	//log('User : ' + userCtx.name + ' changing document: ' +  doc._id);
}
