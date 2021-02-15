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
const Me = ExtensionUtils.getCurrentExtension();

const Gettext = imports.gettext;
Gettext.textdomain("extensions-in-system-menu@leleat-on-github");
Gettext.bindtextdomain("extensions-in-system-menu@leleat-on-github", Me.dir.get_child("locale").get_path());
const _ = Gettext.gettext;

// inspired by tweaks in system menu
// https://extensions.gnome.org/extension/1653/tweaks-in-system-menu/
class Extension {
	constructor() {
	}

	enable() {
		const systemMenu = main.panel.statusArea.aggregateMenu._system;
		const systemMenuItems = systemMenu.menu._getMenuItems();
		const belowSystemPos = systemMenuItems.indexOf(systemMenu._settingsItem) + 1;

		this.settings = ExtensionUtils.getSettings("org.gnome.shell.extensions.extensions-in-system-menu");
		this.settings.connect("changed::extensions", () => {
			this.extensionsItem = this.settings.get_boolean("extensions")
					? this.createSystemMenuItem("org.gnome.Extensions.desktop", belowSystemPos)
					: (this.extensionsItem ? this.extensionsItem.destroy() : null);
		});
		this.settings.connect("changed::tweaks", () => {
			this.tweaksItem = this.settings.get_boolean("tweaks")
					? this.createSystemMenuItem("org.gnome.tweaks.desktop", belowSystemPos + (this.extensionsItem ? 1 : 0))
					: (this.tweaksItem ? this.tweaksItem.destroy() : null);
		});

		if (this.settings.get_boolean("extensions"))
			this.extensionsItem = this.createSystemMenuItem("org.gnome.Extensions.desktop", belowSystemPos);

		if (this.settings.get_boolean("tweaks"))
			this.tweaksItem = this.createSystemMenuItem("org.gnome.tweaks.desktop", belowSystemPos + (this.extensionsItem ? 1 : 0));
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
		const missingAppMsg = _("Install the '%s' app and re-enable this setting.").format("GNOME " + appID.split(".")[2]);
		log(`--- ${missingAppTitle}: ${missingAppMsg} ---`);
		main.notify(missingAppTitle, missingAppMsg);
	}
}

function init() {
	return new Extension();
}
