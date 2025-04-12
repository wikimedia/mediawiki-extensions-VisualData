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

use MediaWiki\Extension\VisualData\Aliases\Html as HtmlClass;
use MediaWiki\Extension\VisualData\Aliases\Title as TitleClass;
use MediaWiki\Extension\VisualData\SchemaProcessor;

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
			$title = TitleClass::newFromText( $par, NS_MAIN );
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

			// required when the address is like title=Special:EditData/Main_Page
			'edit-page' => ( $this->title ? $this->title->getFullText() : '' ),

			'target-slot' => $targetSlot,
			'edit-freetext' => ( !$this->title || !$this->title->isKnown() ),
			'edit-content-model' => true,
			'edit-categories' => true,
			'edit-target-slot' => true,
		];

		$defaultParameters = \VisualData::$FormDefaultParameters;
		array_walk( $defaultParameters, static function ( &$value, $key ) {
			$value = [ $value['default'], $value['type'] ];
		} );

		$params = \VisualData::applyDefaultParams( $defaultParameters, $options );

		// "hardcode" more parameters
		$params['return-url'] = ( $this->title ? $this->title->getLocalURL() : '' );

		[ $text_ ] = explode( '/', $out->getTitle()->getFullText(), 2 );

		$special = SpecialPage::getTitleFor( 'EditData' );
		if ( $text_ !== $special->getFullText() ) {
			$params['origin-url'] = $this->title->getLinkURL( [ 'action' => 'editdata' ] );

		} else {
			$special_ = SpecialPage::getTitleFor( 'EditData', $this->title );
			$params['origin-url'] = $special_->getLinkURL();
		}

		// if ( !$this->title && ExtensionRegistry::getInstance()->isLoaded( 'VEForAll' ) ) {
		// 	$out->addModules( 'ext.veforall.main' );
		// }

		$context = RequestContext::getMain();

		if ( $this->user->isAllowed( 'visualdata-caneditdata' )
			|| $this->user->isAllowed( 'visualdata-canmanageschemas' )
		) {
			\VisualData::initializeAllSchemas( $context );
		}

		$formData = \VisualData::processPageForm( $context, $this->title, [
			'schemas' => $schemas,
			'options' => $params
		] );

		$schemaProcessor = new SchemaProcessor( $context );
		\VisualData::setSchemas( $schemaProcessor, $schemas );

		\VisualData::addJsConfigVars( $out, [
			'loadedSchemas' => \VisualData::$schemas,
			'config' => [
				'context' => 'EditData',
			]
		] );

		// @see SpecialRecentChanges
		$loadingContainer = HtmlClass::rawElement(
			'div',
			[ 'class' => 'rcfilters-head mw-rcfilters-head', 'id' => 'mw-rcfilters-spinner-wrapper', 'style' => 'position: relative' ],
			HtmlClass::rawElement(
				'div',
				[ 'class' => 'initb mw-rcfilters-spinner', 'style' => 'margin-top: auto; top: 25%' ],
				HtmlClass::element(
					'div',
					[ 'class' => 'inita mw-rcfilters-spinner-bounce' ],
				)
			)
		);

		$loadingPlaceholder = HtmlClass::rawElement(
			'div',
			[ 'class' => 'VisualDataFormWrapperPlaceholder' ],
			$this->msg( 'visualdata-loading-placeholder' )->text()
		);

		$out->addHTML( HtmlClass::rawElement( 'div', [
				'data-form-data' => json_encode( $formData ),
				'class' => 'VisualDataFormItem VisualDataFormWrapper'
			], $loadingContainer . $loadingPlaceholder )
		);
	}

}
