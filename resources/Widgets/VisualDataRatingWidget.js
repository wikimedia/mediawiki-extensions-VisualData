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
 * @copyright Copyright © 2021-2022, https://wikisphere.org
 */

( function () {
	// eslint-disable-next-line no-implicit-globals
	VisualDataRatingWidget = function ( config ) {
		config = config || {};

		if ( !( 'classes' in config ) ) {
			config.classes = [];
		}

		// ***important, add position: relative to display
		// property native validation
		config.classes.push( 'visualdata-rating-widget' );

		VisualDataRatingWidget.super.call( this, config );

		// @see https://iamkate.com/code/star-rating-widget/
		var $fieldset = $( ' <div class="rating">' );

		this.$input = $fieldset;

		var self = this;
		this.isChecked = 0;
		for ( var i = 1; i < 6; i++ ) {
			var input = $( '<input>' ).attr( {
				type: 'radio',
				value: i,
				id: 'rating-' + i,
				name: config.name,
				'data-i': i
			} );

			// eslint-disable-next-line eqeqeq
			if ( i == config.value ) {
				input.prop( 'checked', true );
				this.isChecked = i;
			}

			// uncheck the radio button if
			// alread selected, and check the previous one
			input.on( 'click', function () {
				var ii = $( this ).data( 'i' );
				// eslint-disable-next-line eqeqeq
				if ( self.isChecked == ii ) {
					self.isChecked = ii - 1;
					$( this ).prop( 'checked', false );
					$(
						":input[name='" + config.name + "'][data-i='" + ( ii - 1 ) + "']"
					).prop( 'checked', true );
				} else {
					self.isChecked = ii;
				}

				self.emit( 'change', self.getValue() );

			} );

			$fieldset.append( [
				input,
				$( '<label>' ).attr( {
					for: 'rating-' + i
				} )
			] );
		}

		this.getValue = function () {
			return this.isChecked ? String( this.isChecked ) : '';
		};

		this.$element.append( $fieldset );
	};

	OO.inheritClass( VisualDataRatingWidget, OO.ui.Widget );
	OO.mixinClass( VisualDataRatingWidget, OO.EventEmitter );
}() );
