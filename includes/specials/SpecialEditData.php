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
 * @copyright Copyright ©2021-2024, https://wikisphere.org
 */

// @TODO implement as form

class SpecialEditData extends SpecialPage {

	/** @var title */
	protected $title;

	/** @var wikiPage */
	protected $wikiPage;

	/** @var user */
	protected $user;

	/** @inheritDoc */
	public function __construct() {
		$listed = false;

		// https://www.mediawiki.org/wiki/Manual:Special_pages
		parent::__construct( 'EditData', '', $listed );
	}

	/**
	 * @return string
	 */
	public function getDescription() {
		if ( !$this->title || !$this->title->isKnown() ) {
			return $this->msg( "visualdata-editdata-new-article" )->text();
		}

		return $this->msg( "visualdata-editdata-edit", $this->title->getText() )->text();
	}

	/** @inheritDoc */
	public function execute( $par ) {
		$out = $this->getOutput();
		$out->setArticleRelated( false );
		$out->setRobotPolicy( $this->getRobotPolicy() );

		$user = $this->getUser();

		$this->user = $user;

		// This will throw exceptions if there's a problem
		// $this->checkExecutePermissions( $user );

		$securityLevel = $this->getLoginSecurityLevel();

		if ( $securityLevel !== false && !$this->checkLoginSecurityLevel( $securityLevel ) ) {
			$this->displayRestrictionError();
			return;
		}

		$this->addHelpLink( 'Extension:VisualData' );

		if ( $par ) {
			// NS_MAIN is ignored if $par is prefixed
			$title = Title::newFromText( $par, NS_MAIN );
			$this->title = $title;
			$this->wikiPage = \VisualData::getWikiPage( $this->title );
		}

		$this->setData( $out );
		$out->setPageTitle( $this->getDescription() );

		$out->addModules( 'ext.VisualData.Forms' );
	}

	/**
	 * @param OutputPage $out
	 * @return array
	 */
	private function setData( $out ) {
		$schemas = [];
		$jsonData = [];

		if ( $this->title && $this->title->isKnown() ) {
			$jsonData = \VisualData::getJsonData( $this->title );
		}

		if ( !empty( $jsonData['schemas'] ) ) {
			$schemas = array_keys( $jsonData['schemas'] );
		}

		if ( !empty( $_GET['schemas'] ) ) {
			// or $schemas = preg_split( '/\s*,\s*/', $_GET['schemas'], -1, PREG_SPLIT_NO_EMPTY );
			$schemas = array_merge( $schemas, explode( '|', $_GET['schemas'] ) );
		}

		$schemas = array_unique( $schemas );

		$targetSlot = \VisualData::getTargetSlot( $this->title );

		$options = [
			'action' => ( $this->title ? 'edit' : 'create' ),
			'target-slot' => $targetSlot,
			'edit-freetext' => ( !$this->title || !$this->title->isKnown() ),
		];

		$defaultParameters = \VisualData::$FormDefaultParameters;
		array_walk( $defaultParameters, static function ( &$value, $key ) {
			$value = [ $value['default'], $value['type'] ];
		} );

		$params = \VisualData::applyDefaultParams( $defaultParameters, $options );

		// "hardcode" more parameters
		$params['return-url'] = ( $this->title ? $this->title->getLocalURL() : '' );
		$params['origin-url'] = 'http' . ( isset( $_SERVER['HTTPS'] ) && $_SERVER['HTTPS'] === 'on' ? 's' : '' ) . "://$_SERVER[HTTP_HOST]$_SERVER[REQUEST_URI]";

		// if ( !$this->title && ExtensionRegistry::getInstance()->isLoaded( 'VEForAll' ) ) {
		// 	$out->addModules( 'ext.veforall.main' );
		// }

		$pageForms = [
			[
				'options' => $params,
				'schemas' => $schemas
			]
		];

		\VisualData::addJsConfigVars( $out, [
			'pageForms' => $pageForms,
			'config' => [
				'context' => 'EditData',
				'loadedData' => [],
			]
		] );

		// @see SpecialRecentChanges
		$loadingContainer = Html::rawElement(
			'div',
			[ 'class' => 'rcfilters-head mw-rcfilters-head', 'id' => 'mw-rcfilters-spinner-wrapper', 'style' => 'position: relative' ],
			Html::rawElement(
				'div',
				[ 'class' => 'mw-rcfilters-spinner', 'style' => 'margin-top: auto; top: 25%' ],
				Html::element(
					'div',
					[ 'class' => 'mw-rcfilters-spinner-bounce' ]
				)
			)
		);

		$out->addHTML( Html::rawElement( 'div', [
				'id' => 'visualdataform-wrapper-' . ( count( $pageForms ) - 1 ),
				'class' => 'VisualDataFormWrapper'
			], $loadingContainer )
		);
	}

}
