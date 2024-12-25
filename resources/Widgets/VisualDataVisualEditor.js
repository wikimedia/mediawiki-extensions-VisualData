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
 * @copyright Copyright © 2023-2024, https://wikisphere.org
 */

/* eslint-disable no-tabs */
/* eslint-disable no-unused-vars */

( function () {
	// eslint-disable-next-line no-implicit-globals
	VisualDataVisualEditor = function ( config ) {
		config = config || {};
		if ( !( 'classes' in config ) ) {
			config.classes = [];
		}
		var self = this;
		this.config = config;

		// @FIXME only allows wikitext for now
		// this.isHtml =
		// 	"contentModel" in this.config && this.config.contentModel === "html";
		VisualDataVisualEditor.super.call( this, config );

		this.textarea = $( '<textarea rows="8">' )
			.attr( 'name', config.name )
			.attr( 'class', 'visualdata toolbarOnTop' );

		this.text = this.config.value || '';
		this.textarea.val( this.text );

		this.VEInstance = $( '<span>' ).attr( 'class', 've-area-wrapper' );
		this.$element.append( this.VEInstance.append( this.textarea ) );
		this.Editor = null;
		this.initialized = false;
	};

	OO.inheritClass( VisualDataVisualEditor, OO.ui.Widget );
	OO.mixinClass( VisualDataVisualEditor, OO.EventEmitter );

	// @see https://github.com/Open-CSP/FlexForm/blob/main/Modules/FlexForm.general.js
	VisualDataVisualEditor.prototype.initialize = async function ( destroy ) {
		var self = this;
		if ( destroy ) {
			this.destroyEditor();
		}

		if ( this.initialized ) {
			return Promise.resolve( true );
		}

		if ( !self.$element.parent().is( ':visible' ) ) {
			return Promise.reject( 'VEForAll element not visible' );
		}

		return new Promise( ( resolve, reject ) => {
			this.loadVEForAll().then( function () {
				var editor = self.getEditor();
				if ( editor ) {
					editor.initCallbacks.push( function () {
						self.initialized = true;
						resolve();
					} );
				} else {
					reject( 'VEForAll no editor' );
				}
			} );
		} );
	};

	// @see https://github.com/Open-CSP/FlexForm/blob/main/Modules/FlexForm.general.js
	VisualDataVisualEditor.prototype.loadVEForAll = async function () {
		var self = this;

		var callbackCond = function () {
			return typeof $().applyVisualEditor === 'function';
		};

		var callback = function ( resolve, reject ) {
			self.textarea.applyVisualEditor();
			resolve();
		};
		var callbackMaxAttempts = function ( resolve, reject ) {
			jQuery( document ).on( 'VEForAllLoaded', function ( e ) {
				self.textarea.applyVisualEditor();
				resolve();
			} );
		};

		return VisualDataFunctions.waitUntil(
			callbackCond,
			callback,
			callbackMaxAttempts,
			5
		);
	};

	VisualDataVisualEditor.prototype.destroyEditor = function () {
		this.initialized = false;
		if ( typeof $.fn.getVEInstances === 'function' ) {
			var visualEditors = $.fn.getVEInstances();
			for ( var i in visualEditors ) {
				var editor = visualEditors[ i ];
				if ( $( editor.$node ).attr( 'name' ) === this.config.name ) {
					editor.destroy();
					visualEditors.splice( i, 1 );
				}
			}
		}
	};

	// @see PageForms PF_submit.js
	VisualDataVisualEditor.prototype.getEditor = function () {
		if ( !( 'getVEInstances' in $.fn ) ) {
			return null;
		}
		if ( this.Editor ) {
			return this.Editor;
		}
		var visualEditors = $.fn.getVEInstances();
		for ( var editor of visualEditors ) {
			if ( $( editor.$node ).attr( 'name' ) === this.config.name ) {
				// eslint-disable-next-line no-return-assign
				return this.Editor = editor;
			}
		}
	};

	VisualDataVisualEditor.prototype.getValue = async function () {
		var self = this;
		var editor = this.getEditor();

		if ( !this.initialized || !( 'target' in editor ) ) {
			return this.textarea.val();
		}

		// if (this.isHtml) {
		// 	return VisualDataFunctions.decodeHTMLEntities( editor.target.getSurface().getHtml() );
		// }

		return new Promise( ( resolve, reject ) => {
			$.when( editor.target.updateContent() ).then( function () {
				// @see ext.veforall.target.js
				// *** sometimes convertToWikiText is not called
				// based on focus
				editor.target.$node.addClass( 've-for-all-waiting-for-update' );
				resolve( self.textarea.val() );
			} );
		} );
	};
}() );
