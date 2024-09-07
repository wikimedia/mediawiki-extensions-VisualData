<?php
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
 * along with VisualData.  If not, see <http://www.gnu.org/licenses/>.
 *
 * @file
 * @ingroup extensions
 * @author thomas-topway-it <support@topway.it>
 * @copyright Copyright ©2024, https://wikisphere.org
 */

namespace MediaWiki\Extension\VisualData\Scribunto;

// @credits https://github.com/Open-CSP/WSSlots/tree/master/src/Scribunto
class LuaLibrary extends \Scribunto_LuaLibraryBase {

	/**
	 * @inheritDoc
	 */
	public function register(): void {
		$interfaceFuncs = [
			'query' => [ $this, 'query' ]
		];

		$this->getEngine()->registerInterface( __DIR__ . '/' . 'mw.visualdata.lua', $interfaceFuncs, [] );
	}

	/**
	 * @param string $schema
	 * @param string $query
	 * @param array $printouts []
	 * @param array $params []
	 * @return array
	 */
	public function query( $schema, $query, $printouts = [], $params = [] ) {
		$result = \VisualData::getQueryResults( $schema, $query, $printouts ?? [], $params ?? [] );
		return [ $this->convertToLuaTable( $result ) ];
	}

	/**
	 * @param array $array
	 * @return mixed
	 */
	private function convertToLuaTable( $array ) {
		if ( is_array( $array ) ) {
			foreach ( $array as $key => $value ) {
				$array[$key] = $this->convertToLuaTable( $value );
			}

			array_unshift( $array, '' );
			unset( $array[0] );
		}

		return $array;
	}
}
