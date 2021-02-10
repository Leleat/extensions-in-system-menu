"use strict";

const {Gio, GObject, Gtk} = imports.gi;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

function init() {
}

function buildPrefsWidget() {
	const widget = new ExtensionsSystemMenuPrefsWidget();
	widget.show_all();
	return widget;
}

const ExtensionsSystemMenuPrefsWidget = GObject.registerClass(
	class ExtensionsSystemMenuPrefsWidget extends Gtk.Box {
		_init(params) {
			super._init(params);

			this.builder = new Gtk.Builder();
			this.builder.add_from_file(Me.path + "/prefs.ui");
			this.add(this.builder.get_object("main_prefs"));

			const gschema = Gio.SettingsSchemaSource.new_from_directory(Me.dir.get_child("schemas").get_path(), Gio.SettingsSchemaSource.get_default(), false);
			const settingsSchema = gschema.lookup("org.gnome.shell.extensions.extensions-in-system-menu", true);
			this.settings = new Gio.Settings({settings_schema: settingsSchema});

			this.bindSettingsToUI(settingsSchema.list_keys());
		}

		// the widgets in prefs.ui need to have same ID as the keys in the gschema.xml
		bindSettingsToUI(keys) {
			// manually add the keys to the arrays in this function
			const getBindProperty = function(key) {
				const ints = [];
				const bools = ["extensions", "tweaks"];

				if (ints.includes(key))
					return "value"; // Gtk.Spinbox.value
				else if (bools.includes(key))
					return "active"; //  Gtk.Switch.active
				else
					return null;
			};

			keys.forEach(key => {
				const bindProperty = getBindProperty(key);
				const widget = this.builder.get_object(key);
				if (widget !== null && bindProperty)
					this.settings.bind(key, widget, bindProperty, Gio.SettingsBindFlags.DEFAULT);
			});
		}
	}
)