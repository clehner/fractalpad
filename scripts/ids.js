(function () {

	var seperator = "_",
		digits =
			"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+-";

	function TreeID(branchingFactor, prefix) {
		this.prefix = prefix;
		this.b = branchingFactor;
	}
	this.TreeID = TreeID;

	TreeID.prototype.start = function () {
		var one = digits.charAt(1);
		return [this.prefix, one, one].join(seperator);
	};

	TreeID.prototype.child = function (parentId, me) {
		var i = parentId.indexOf(seperator);
		if (i == -1) {
			throw new Error("Invalid tree ID");
		}
		var ancestors = parentId.substr(0, i);
		var descendants = parentId.substr(i+1);

		var end = parentId.length - 1;
		var last = parentId.charAt(end);
		var rest = parentId.substr(0, end);

		var lastCode = digits.indexOf(last);
		if (lastCode <= 0) {
			rest += last;
			lastCode = 1;
		}
		var val = (lastCode << 1) + me;
		if (val & 64) {
			// last bit is set. the base64 char is filled.
			// the last bit does not contain information, so discard it.
			return rest + digits.charAt(val & 63) + digits.charAt(1);
		} else {
			return rest + digits.charAt(val);
		}
	};

	TreeID.prototype.parent = function (childId) {
		var end, last, rest, code;
		end = childId.length - 1;
		last = childId.charAt(end);
		rest = childId.substr(0, end);
		code = digits.indexOf(last);

		if (code == 1) {
			end = rest.length - 1;
			last = rest.charAt(end);
			rest = rest.substr(0, end);
			code = digits.indexOf(last) | 64;
		}
		var sub = code & 1;
		var parent = rest;
		if (code == -1) {
			parent += last;
			sub = null;
		} else {
			parent += digits.charAt(code >> 1);
		}
		return [parent, sub];
	};

}).call(this);
if (this.exports) this.exports = this.TreeId;
