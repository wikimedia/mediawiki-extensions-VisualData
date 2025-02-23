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
 * @copyright Copyright ©2025, https://wikisphere.org
 */

/* eslint-disable no-tabs */

( function () {
	// eslint-disable-next-line no-implicit-globals
	VisualDataDateTimeInputWidget = function ( config ) {
		var date = this.parseLocalDate( config.value );
		if ( date ) {
			config.value = date.toISOString();
		}

		VisualDataDateTimeInputWidget.super.call( this, config );
	};

	OO.inheritClass( VisualDataDateTimeInputWidget, mw.widgets.datetime.DateTimeInputWidget );

	/**
	 * @private
	 * @param {string} value
	 * @return {Date|null}
	 */
	VisualDataDateTimeInputWidget.prototype.parseLocalDate = function ( value ) {
		// @see mw.widgets.datetime.DateTimeInputWidget -> parseDate
		var date, m;

		// value = String( value );
		// switch ( this.type ) {
		// 	case 'date':
		// 		value = value + 'T00:00:00Z';
		// 		break;
		// 	case 'time':
		// 		value = '1970-01-01T' + value + 'Z';
		// 		break;
		// }

		// m = /^(\d{4,})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?Z$/.exec( value );

		// ***edited, matches both +01:00 (ISO 8601 vP) and +0100 (ISO 8601 vO)
		// eslint-disable-next-line security/detect-unsafe-regex
		const regex = /^(\d{4,})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?(Z|[+-]\d{2}:?\d{2}|[+-]\d{4})?$/;

		m = regex.exec( value );

		if ( m ) {
			if ( m[ 7 ] ) {
				while ( m[ 7 ].length < 3 ) {
					m[ 7 ] += '0';
				}
			} else {
				m[ 7 ] = 0;
			}
			date = new Date();

			// ***edited, replace UTC with '' in following methods
			date.setFullYear( m[ 1 ], m[ 2 ] - 1, m[ 3 ] );
			date.setHours( m[ 4 ], m[ 5 ], m[ 6 ], m[ 7 ] );

			// ***edited, replace UTC with '' in following methods
			if ( date.getTime() < -62167219200000 || date.getTime() > 253402300799999 ||
				date.getFullYear() !== +m[ 1 ] ||
				date.getMonth() + 1 !== +m[ 2 ] ||
				date.getDate() !== +m[ 3 ] ||
				date.getHours() !== +m[ 4 ] ||
				date.getMinutes() !== +m[ 5 ] ||
				date.getSeconds() !== +m[ 6 ] ||
				date.getMilliseconds() !== +m[ 7 ]
			) {
				date = null;
			}

		} else {
			date = null;
		}

		return date;
	};
}() );
