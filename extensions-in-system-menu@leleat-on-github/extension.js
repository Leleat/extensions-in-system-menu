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
		const extensionsApp = this.getExtensionsApp();
		if (!extensionsApp)
			return this.notifyNotInstalled();

		const [icon, name] = [extensionsApp.app_info.get_icon().names[0], extensionsApp.get_name()];
		this.extensionsMenuItem = new popupMenu.PopupImageMenuItem(name, icon);
		const systemMenu = main.panel.statusArea.aggregateMenu._system;
		systemMenu.menu.addMenuItem(this.extensionsMenuItem);

		const menuItems = systemMenu.menu._getMenuItems();
		const menuItemPos = menuItems.indexOf(systemMenu._settingsItem) + 1;
		systemMenu.menu.moveMenuItem(this.extensionsMenuItem, menuItemPos);

		this.extensionsMenuItem.connect("activate", this.onActivate.bind(this));
	}

	disable() {
		if (!this.extensionsMenuItem)
			return;

		this.extensionsMenuItem.destroy();
		this.extensionsMenuItem = null;
	}

	getExtensionsApp() {
		const extensionsID = "org.gnome.Extensions.desktop";
		return Shell.AppSystem.get_default().lookup_app(extensionsID);
	}

	onActivate() {
		const extensionsApp = this.getExtensionsApp();
		if (!extensionsApp) // app got uninstalled while this extension was active
			return this.notifyNotInstalled();

		main.overview.hide();
		const systemMenu = main.panel.statusArea.aggregateMenu._system;
		systemMenu.menu.itemActivated(boxpointer.PopupAnimation.NONE);
		extensionsApp.activate();
	}

	notifyNotInstalled() {
		const missingAppTitle = "Extension-in-system-menu";
		const missingAppMsg = _("Install the 'Extensions' app and reload this extension.");
		log(`--- ${missingAppTitle}: ${missingAppMsg} ---`);
		main.notify(missingAppTitle, missingAppMsg);

		this.disable(); // only destroys the menuItem
	}
}

function init() {
	return new Extension();
}
