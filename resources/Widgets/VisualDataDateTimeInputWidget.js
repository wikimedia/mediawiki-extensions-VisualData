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

( function () {
	// eslint-disable-next-line no-implicit-globals
	VisualDataDateTimeInputWidget = function ( config ) {
		var type = 'datetime';

		if ( VisualDataFunctions.getNestedProp( [ 'data', 'model', 'schema', 'format' ], config ) ) {
			type = config.data.model.schema.format;

			// *** not used anymore, set always as local
			if ( type === 'datetime-local' ) {
				type = 'datetime';
			}
		}

		var formatter = {
			format: '@' + type
		};

		config.formatter = new mw.widgets.datetime.ProlepticGregorianDateTimeFormatter( formatter );

		// config.formatter.local = ( config.data.model.schema.format === 'datetime-local' );
		config.formatter.local = true;

		VisualDataDateTimeInputWidget.super.call( this, config );
	};

	OO.inheritClass( VisualDataDateTimeInputWidget, mw.widgets.datetime.DateTimeInputWidget );

	/**
	 * @inheritDoc
	 */
	VisualDataDateTimeInputWidget.prototype.parseDateValue = function ( value ) {
		value = String( value );
		switch ( this.type ) {
			case 'date':
				value = value + 'T00:00:00Z';
				break;
			case 'time':
				value = '1970-01-01T' + value + 'Z';
				break;
		}

		let date;

		// const m = /^(\d{4,})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?Z$/.exec( value );
		// ***edited, matches both +01:00 (ISO 8601 vP) and +0100 (ISO 8601 vO)

		const m = /^(\d{4,})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?(Z|[+-]\d{2}:?\d{2}|[+-]\d{4})?$/.exec( value );

		if ( m ) {
			if ( m[ 7 ] ) {
				while ( m[ 7 ].length < 3 ) {
					m[ 7 ] += '0';
				}
			} else {
				m[ 7 ] = 0;
			}
			date = new Date();
			date.setUTCFullYear( m[ 1 ], m[ 2 ] - 1, m[ 3 ] );
			date.setUTCHours( m[ 4 ], m[ 5 ], m[ 6 ], m[ 7 ] );
			if ( date.getTime() < -62167219200000 || date.getTime() > 253402300799999 ||
				date.getUTCFullYear() !== +m[ 1 ] ||
				date.getUTCMonth() + 1 !== +m[ 2 ] ||
				date.getUTCDate() !== +m[ 3 ] ||
				date.getUTCHours() !== +m[ 4 ] ||
				date.getUTCMinutes() !== +m[ 5 ] ||
				date.getUTCSeconds() !== +m[ 6 ] ||
				date.getUTCMilliseconds() !== +m[ 7 ]
			) {
				date = null;
			}
		} else {
			date = null;
		}

		return date;
	};

}() );
