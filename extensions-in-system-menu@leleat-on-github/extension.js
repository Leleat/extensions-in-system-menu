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
		this.settings.connect("changed::extensions", () => {
			this.extensionsItem = this.settings.get_boolean("extensions")
					? this.createSystemMenuItem("org.gnome.Extensions.desktop", this.settings.get_int("extensions-pos"))
					: (this.extensionsItem ? this.extensionsItem.destroy() : null);
		});
		this.settings.connect("changed::tweaks", () => {
			this.tweaksItem = this.settings.get_boolean("tweaks")
					? this.createSystemMenuItem("org.gnome.tweaks.desktop", this.settings.get_int("tweaks-pos"))
					: (this.tweaksItem ? this.tweaksItem.destroy() : null);
		});
		this.settings.connect("changed::extensions-pos", () => {
			this.extensionsItem && this.extensionsItem.destroy();
			this.extensionsItem = this.createSystemMenuItem("org.gnome.Extensions.desktop", this.settings.get_int("extensions-pos"));
		});
		this.settings.connect("changed::tweaks-pos", () => {
			this.tweaksItem && this.tweaksItem.destroy();
			this.tweaksItem = this.createSystemMenuItem("org.gnome.tweaks.desktop", this.settings.get_int("tweaks-pos"));
		});

		if (this.settings.get_boolean("extensions"))
			this.extensionsItem = this.createSystemMenuItem("org.gnome.Extensions.desktop", this.settings.get_int("extensions-pos"));

		if (this.settings.get_boolean("tweaks"))
			this.tweaksItem = this.createSystemMenuItem("org.gnome.tweaks.desktop", this.settings.get_int("tweaks-pos"));
	}

	disable() {
		if (this.extensionsItem) {
			this.extensionsItem.destroy();
			this.extensionsItem = null;
		}

		if (this.tweaksItem) {
			this.tweaksItem.destroy();
			this.tweaksItem = null;
		}

		this.settings.run_dispose();
		this.settings = null;
	}

	createSystemMenuItem(appID, pos) {
		const app = Shell.AppSystem.get_default().lookup_app(appID);
		if (!app)
			return this.notifyNotInstalled(appID);

		const [name, icon] = [app.get_name(), app.app_info.get_icon().names[0]];
		const item = new popupMenu.PopupImageMenuItem(name, icon);
		const systemMenu = main.panel.statusArea.aggregateMenu._system;
		systemMenu.menu.addMenuItem(item);

		pos = Math.max(0, pos);
		pos = Math.min(pos, systemMenu.menu._getMenuItems().length - 1);
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
