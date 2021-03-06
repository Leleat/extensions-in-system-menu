/* extension.js
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

/* exported init */

const {boxpointer, main, popupMenu} = imports.ui;
const {Shell} = imports.gi;

const ExtensionUtils = imports.misc.extensionUtils;

// inspired by tweaks in system menu
// https://extensions.gnome.org/extension/1653/tweaks-in-system-menu/
class Extension {
	constructor() {
	}

	enable() {
		this.settings = ExtensionUtils.getSettings("org.gnome.shell.extensions.extensions-in-system-menu");
		this.settings.connect("changed::extensions", () => this.updateItems());
		this.settings.connect("changed::tweaks", () => this.updateItems());
		this.settings.connect("changed::extensions-pos", () => this.updateItems());
		this.settings.connect("changed::tweaks-pos", () => this.updateItems());

		this.updateItems();
	}

	disable() {
		this.extensionsItem && this.extensionsItem.destroy();
		this.extensionsItem = null;
		this.tweaksItem && this.tweaksItem.destroy();
		this.tweaksItem = null;

		this.settings.run_dispose();
		this.settings = null;
	}

	updateItems() {
		this.extensionsItem = this.extensionsItem && this.extensionsItem.destroy();
		this.tweaksItem = this.tweaksItem && this.tweaksItem.destroy();

		const extensionsPos = this.settings.get_int("extensions-pos");
		const tweaksPos = this.settings.get_int("tweaks-pos");

		const createExtensions = function() {
			if (this.settings.get_boolean("extensions"))
				this.extensionsItem = this.createSystemMenuItem("org.gnome.Extensions.desktop", extensionsPos);
		}
		const createTweaks = function() {
			if (this.settings.get_boolean("tweaks"))
				this.tweaksItem = this.createSystemMenuItem("org.gnome.tweaks.desktop", tweaksPos);
		}

		if (extensionsPos < tweaksPos)
			createExtensions.call(this) || createTweaks.call(this);
		else
			createTweaks.call(this) || createExtensions.call(this);
	}

	createSystemMenuItem(appID, pos) {
		const app = Shell.AppSystem.get_default().lookup_app(appID);
		if (!app)
			return this.notifyNotInstalled(appID);

		const iconNames = app.app_info.get_icon().names; // workaround #4
		const [name, icon] = [app.get_name(), iconNames ? iconNames[0] : appID.slice(0, appID.lastIndexOf("."))];
		const item = new popupMenu.PopupImageMenuItem(name, icon);
		const systemMenu = main.panel.statusArea.aggregateMenu._system;
		systemMenu.menu.addMenuItem(item);
		systemMenu.menu.moveMenuItem(item, pos);

		item.connect("activate", this.onActivate.bind(this, appID));
		return item;
	}

	onActivate(appID) {
		const app = Shell.AppSystem.get_default().lookup_app(appID);
		if (!app) // app got uninstalled while this extension was active
			return this.notifyNotInstalled(appID);

		main.overview.hide();
		const systemMenu = main.panel.statusArea.aggregateMenu._system;
		systemMenu.menu.itemActivated(boxpointer.PopupAnimation.NONE);
		app.activate();
	}

	notifyNotInstalled(appID) {
		const missingAppTitle = "Extension & Tweaks in system menu";
		const missingAppMsg = `Install the GNOME ${appID.split(".")[2]} app and re-enable this setting`;
		log(`--- ${missingAppTitle}: ${missingAppMsg} ---`);
		main.notify(missingAppTitle, missingAppMsg);
	}
}

function init() {
	return new Extension();
}
