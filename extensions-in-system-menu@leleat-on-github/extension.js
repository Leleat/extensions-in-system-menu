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

// inspired by tweaks in system menu
// https://extensions.gnome.org/extension/1653/tweaks-in-system-menu/
class Extension {
	constructor() {
	}

	enable() {
		const extensionsApp = this.getExtensionsApp();
		if (!extensionsApp)
			return;

		const [icon, name] = [extensionsApp.app_info.get_icon().names[0], extensionsApp.get_name()];
		this.extensionsMenuItem = new popupMenu.PopupImageMenuItem(name, icon);
		this.systemMenu = main.panel.statusArea.aggregateMenu._system;
		this.systemMenu.menu.addMenuItem(this.extensionsMenuItem);
		
		const menuItems = this.systemMenu.menu._getMenuItems();
		this.menuItemPos = menuItems.indexOf(this.systemMenu._settingsItem) + 1;
		this.systemMenu.menu.moveMenuItem(this.extensionsMenuItem, this.menuItemPos);

		this.extensionsMenuItem.connect("activate", this.onActivate.bind(this));
	}

	disable() {
		if (!this.extensionsMenuItem)
			return;

		this.systemMenu.menu._getMenuItems().splice(this.menuItemPos, 1);
		this.extensionsMenuItem.destroy();
		this.extensionsMenuItem = null;
		this.systemMenu = null;
	}
	
	getExtensionsApp() {
		const extensionsID = "org.gnome.Extensions.desktop";
		return Shell.AppSystem.get_default().lookup_app(extensionsID);
	}

	onActivate() {
		const extensionsApp = this.getExtensionsApp();
		if (!extensionsApp) {
			main.notify("Extensions in system menu", "The 'Extensions' app isn't installed anymore.");
			return;
		}

		main.overview.hide();            
		this.systemMenu.menu.itemActivated(boxpointer.PopupAnimation.NONE);
		extensionsApp.activate();
	}
}

function init() {
	return new Extension();
}
