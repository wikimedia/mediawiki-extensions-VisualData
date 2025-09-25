/**
 * This file is part of the MediaWiki extension VisualData.
 *
 * VisualData is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * VisualData is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with VisualData. If not, see <http://www.gnu.org/licenses/>.
 *
 * @file
 * @author thomas-topway-it <support@topway.it>
 * @copyright Copyright © 2024, https://wikisphere.org
 */

/* eslint-disable no-unused-vars */

( function () {
	// eslint-disable-next-line no-implicit-globals
	VisualDataTinyMCE = function ( config ) {
		config = config || {};
		if ( !( 'classes' in config ) ) {
			config.classes = [];
		}
		var self = this;
		this.initialized = false;
		this.config = config;

		VisualDataTinyMCE.super.call( this, config );

		this.textareaId = 'visualdata-tinimce-' + config.data.model.path;

		this.textarea = $( '<textarea rows="8">' )
			.attr( 'name', config.name )
			.attr( 'id', this.textareaId );

		this.text = this.config.value || '';
		this.textarea.val( this.text );

		this.$element.append( this.textarea );

		var mw_extensionAssetsPath = mw.config.get( 'wgExtensionAssetsPath' );
		this.basePath = mw_extensionAssetsPath + '/VisualData/resources/tinymce';

		this.scripts = [
			this.basePath + '/tinymce.min.js'
		];
	};

	OO.inheritClass( VisualDataTinyMCE, OO.ui.Widget );
	OO.mixinClass( VisualDataTinyMCE, OO.EventEmitter );

	VisualDataTinyMCE.prototype.initialize = async function () {
		var self = this;
		if ( self.initialized ) {
			return;
		}

		// only load scripts
		if ( !self.$element.parent().is( ':visible' ) ) {
			VisualDataFunctions.loadScripts( this.scripts );
			throw 'TinyMCE element not visible';
		}

		return new Promise( ( resolve, reject ) => {
			VisualDataFunctions.loadScripts( this.scripts, function ( e ) {
				this.tinymce = tinymce.init( {
					base_url: this.basePath,
					statusbar: false,
					selector: '#' + jQuery.escapeSelector( self.textareaId ),
					object_resizing: true,
					allow_html_in_named_anchor: true,
					browser_spellcheck: true,
					automatic_uploads: true,
					paste_data_images: true,
					showPlaceholders: false,
					decodeHtmlEntitiesOnInput: false,
					auto_focus: true,
					visual: false,
					setup: function ( editor ) {
						editor.on( 'init', function () {
							self.initialized = true;
							// editor.setContent( self.text );
							resolve();
						} );
					}
					// license_key: 'gpl|<your-license-key>',
				} );
			} );
		} );
	};

	VisualDataTinyMCE.prototype.getValue = function () {
		if ( typeof tinymce === 'undefined' ) {
			return this.text;
		}
		var editor = tinymce.get( this.textareaId );
		if ( editor && this.initialized ) {
			return editor.getContent( this.textareaId );
		}
		return this.text;
	};
}() );
