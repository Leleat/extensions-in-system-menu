"use strict";

const {Gio, GObject, Gtk} = imports.gi;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const shellVersion = parseFloat(imports.misc.config.PACKAGE_VERSION);

function init() {
}

function buildPrefsWidget() {
	const prefsWidget = new PrefsWidget();
	shellVersion < 40 && prefsWidget.show_all();
	return prefsWidget;
}

const PrefsWidget = GObject.registerClass(
	class ExtensionsSystemMenuPrefsWidget extends Gtk.Box {
		_init(params) {
			super._init(params);

			this.builder = new Gtk.Builder();
			this.builder.add_from_file(Me.path + "/prefs.ui");

			const mainPrefs = this.builder.get_object("main_prefs");
			shellVersion < 40 ? this.add(mainPrefs) : this.append(mainPrefs);

			const gschema = Gio.SettingsSchemaSource.new_from_directory(Me.dir.get_child("schemas").get_path(), Gio.SettingsSchemaSource.get_default(), false);
			const settingsSchema = gschema.lookup("org.gnome.shell.extensions.extensions-in-system-menu", true);
			this.settings = new Gio.Settings({settings_schema: settingsSchema});

			this.bindWidgetsToSettings(settingsSchema.list_keys());
			this.bindWidgetsTogether();
		}

		bindWidgetsToSettings(keys) {
			// widgets in prefs.ui need to have same ID
			// as the keys in the gschema.xml file
			const getBindProperty = function(key) {
				const ints = ["extensions-pos", "tweaks-pos"];
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
				if (widget && bindProperty)
					this.settings.bind(key, widget, bindProperty, Gio.SettingsBindFlags.DEFAULT);
			});
		}

		bindWidgetsTogether() {
			const extensionsToggle = this.builder.get_object("extensions");
			const extensionsPos = this.builder.get_object("extensions-pos-box");
			extensionsToggle.bind_property("active", extensionsPos, "sensitive", GObject.BindingFlags.DEFAULT);

			const tweaksToggle = this.builder.get_object("tweaks");
			const tweaksPos = this.builder.get_object("tweaks-pos-box");
			tweaksToggle.bind_property("active", tweaksPos, "sensitive", GObject.BindingFlags.DEFAULT);
		}
	}
)
