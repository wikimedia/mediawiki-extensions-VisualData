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
 * @copyright Copyright ©2021-2023, https://wikisphere.org
 */

class VisualDataApiCheckLatestVersion extends ApiBase {

	/**
	 * @inheritDoc
	 */
	public function isWriteMode() {
		return false;
	}

	/**
	 * @inheritDoc
	 */
	public function mustBePosted(): bool {
		return true;
	}

	/**
	 * @inheritDoc
	 */
	public function execute() {
		$user = $this->getUser();
		\VisualData::initialize();

		// @see SpecialVisualData -> addJsConfigVars
		$groups = [ 'sysop', 'bureaucrat', 'visualdata-admin' ];

		// execute if any of the condition below is true
		if ( !$user->isAllowed( 'visualdata-canmanageschemas' )
			// execute if user is in the admin group
			&& !count( array_intersect( $groups, \VisualData::getUserGroups( $user ) ) ) ) {
			$this->dieWithError( 'apierror-visualdata-permissions-error' );
		}

		$result = $this->getResult();
		$contents = file_get_contents( 'https://www.mediawiki.org/wiki/Extension:VisualData' );

		if ( $contents === false ) {
			$result->addValue( [ $this->getModuleName() ], 'result', 0, ApiResult::NO_VALIDATE );
			return;
		}

		libxml_use_internal_errors( true );
		$xml = new DOMDocument();
		$xml->validateOnParse = false;
		$xml->loadHTML( $contents );

		$xpath = new DOMXPath( $xml );

		$classname = "ext-infobox";
		$table = $xpath->query( "//*[contains(@class, '$classname')]" )->item( 0 );
		$rows = $table->getElementsByTagName( "tr" );

		$latestVersion = null;

		foreach ( $rows as $row ) {
			$cells = $row->getElementsByTagName( 'td' );
			foreach ( $cells as $key => $cell ) {
				if ( trim( $cell->nodeValue ) === 'Latest version' ) {
					$latestVersion = trim( $cells[$key + 1]->nodeValue );
					break 2;
				}
			}
		}

		if ( $latestVersion === null ) {
			$result->addValue( [ $this->getModuleName() ], 'result', 0, ApiResult::NO_VALIDATE );
			return;
		}

		$installedVersion = ExtensionRegistry::getInstance()->getAllThings()['VisualData']['version'];

		$updated = ( strpos( $latestVersion, $installedVersion ) === 0 );

		$result->addValue( [ $this->getModuleName() ], 'result', ( $updated ? 1 : 2 ), ApiResult::NO_VALIDATE );
	}

	/**
	 * @inheritDoc
	 */
	public function getAllowedParams() {
		return [];
	}

	/**
	 * @inheritDoc
	 */
	public function needsToken() {
		return 'csrf';
	}

	/**
	 * @inheritDoc
	 */
	protected function getExamples() {
		return false;
	}
}
