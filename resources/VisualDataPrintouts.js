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
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with VisualData. If not, see <http://www.gnu.org/licenses/>.
 *
 * @file
 * @author thomas-topway-it <support@topway.it>
 * @copyright Copyright ©2025, https://wikisphere.org
 */

/* eslint-disable no-unused-vars */

const VisualDataPrintouts = function () {
	dayjs.extend( window.dayjs_plugin_utc );
	dayjs.extend( window.dayjs_plugin_timezone );

	function handleTimeLinks( el, elIndex ) {
		var $el = $( el );
		var data = $el.data();
		$el.text( VisualDataFunctions.dateToLocal( data.datetime, data.format ) );
	}

	function handleTables( el, elIndex ) {
		var $el = $( el );
		var data = $el.data();

		var headers = $el.find( 'th' ).map( function () {
			return $( this ).text().trim();
		} ).get();

		var reversePrintouts = VisualDataFunctions.objectEntries(
			VisualDataFunctions.objectEntries( data.printouts ).map( ( [ key, value ] ) => [ value, key ] )
		);

		$( el ).find( 'tr' ).each( function () {
			$( this ).find( 'td' ).each( function ( i ) {
				var header = headers[ i ];
				var printout = reversePrintouts[ header ];
				if ( !printout ) {
					return;
				}
				var format = data.mapPathSchema[ printout ].format;
				if ( $.inArray( format, [ 'time', 'date', 'datetime', 'datetime-local' ] ) ) {
					var $cell = $( this );
					$( this ).text( VisualDataFunctions.dateToLocalPrintout( $cell.text().trim(), format, data.printoutsOptions[ printout ] ) );
				}
			} );
		} );
	}

	return {
		handleTables,
		handleTimeLinks
	};
};

$( function () {
	var visualDataPrintouts = new VisualDataPrintouts();

	$( '.visualdata.wikitable' ).each( function ( index ) {
		visualDataPrintouts.handleTables( this, index );
	} );

	$( '.visualdata-time-element' ).each( function ( index ) {
		visualDataPrintouts.handleTimeLinks( this, index );
	} );
} );
