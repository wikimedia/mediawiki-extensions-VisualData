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

class SpecialManageSchemas extends SpecialPage {

	/** @var user */
	protected $user;

	/** @inheritDoc */
	public function __construct() {
		$listed = true;

		// https://www.mediawiki.org/wiki/Manual:Special_pages
		parent::__construct( 'ManageSchemas', '', $listed );
	}

	/** @inheritDoc */
	protected function getFormFields() {
	}

	/** @inheritDoc */
	public function execute( $par ) {
		$out = $this->getOutput();
		$out->setArticleRelated( false );
		$out->setRobotPolicy( $this->getRobotPolicy() );

		$user = $this->getUser();

		$this->user = $user;

		$securityLevel = $this->getLoginSecurityLevel();

		if ( $securityLevel !== false && !$this->checkLoginSecurityLevel( $securityLevel ) ) {
			$this->displayRestrictionError();
			return;
		}

		$this->addHelpLink( 'Extension:VisualData' );

		if ( !$user->isAllowed( 'visualdata-canmanageschemas' ) ) {
			$this->displayRestrictionError();
			return;
		}

		$this->outputHeader();

		$context = $this->getContext();

		$context->getOutput()->enableOOUI();

		$out->setPageTitle( $this->msg( 'manageschemas' )->text() );

		$out->addModules( [
			'ext.VisualData.DatatablesLite',
			'ext.VisualData.ManageSchemas'
		] );

		$out->addModuleStyles( [ 'mediawiki.special.preferences.styles.ooui' ] );

		\VisualData::initializeAllSchemas( $context );

		\VisualData::addJsConfigVars( $out, [
			'loadedSchemas' => \VisualData::$schemas,
			'config' => [
				'context' => 'ManageSchemas',
			]
		] );

		// @see SpecialRecentChanges
		$loadingContainer = HtmlClass::rawElement(
			'div',
			[ 'class' => 'rcfilters-head mw-rcfilters-head', 'id' => 'mw-rcfilters-spinner-wrapper', 'style' => 'position: relative' ],
			HtmlClass::rawElement(
				'div',
				[ 'class' => 'mw-rcfilters-spinner', 'style' => 'margin-top: auto; top: 25%' ],
				HtmlClass::element(
					'div',
					[ 'class' => 'mw-rcfilters-spinner-bounce' ]
				)
			)
		);

		$loadingPlaceholder = HtmlClass::rawElement(
			'div',
			[ 'class' => 'VisualDataFormWrapperPlaceholder' ],
			$this->msg( 'visualdata-loading-placeholder' )->text()
		);

		$out->addHTML( HtmlClass::rawElement( 'div', [
				'id' => 'schemas-wrapper',
			], $loadingContainer . $loadingPlaceholder )
		);
	}

	/**
	 * @see includes/htmlform/HTMLForm.php
	 * @param string $value
	 * @return Message
	 */
	protected function getMessage( $value ) {
		return Message::newFromSpecifier( $value )->setContext( $this->getContext() );
	}

	/**
	 * @return string
	 */
	protected function getGroupName() {
		return 'visualdata';
	}

}
