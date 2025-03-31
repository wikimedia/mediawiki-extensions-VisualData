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

use MediaWiki\Extension\VisualData\Aliases\Title as TitleClass;
use MediaWiki\Extension\VisualData\SubmitForm;

class SpecialVisualDataSubmit extends SpecialPage {

	/** @var user */
	protected $user;

	/** @var title */
	protected $title;

	/** @inheritDoc */
	public function __construct() {
		$listed = false;

		// https://www.mediawiki.org/wiki/Manual:Special_pages
		parent::__construct( 'VisualDataSubmit', '', $listed );
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

		// NS_MAIN is ignored if $par is prefixed
		$title = TitleClass::newFromText( $par, NS_MAIN );
		$this->title = $title;

		$request = $this->getRequest();

		$data = $request->getVal( 'data', '{}' );

		$this->onFormSubmit( $data );
	}

	/**
	 * @param array $data
	 * @return void|bool
	 */
	private function onFormSubmit( $data ) {
		$data = json_decode( $data, true );

		if ( empty( $data ) ) {
			return false;
		}

		$submitForm = new SubmitForm( $this->user, $this->getContext() );

		$result = $submitForm->processData( $data );

		if ( !count( $result['errors'] ) ) {
			header( 'Location: ' . $result['target-url'] );
			return true;
		}

		array_unshift( $result['errors'], $this->msg( "visualdata-special-submit-contentsnotsaved" )->text() );

		$obj = [
			$data['formID'] => [
				'freetext' => $result['freetext'],
				'jsonData' => $result['jsonData'],
				'categories' => $result['categories'],
				'errors' => $result['errors'],
				'userDefined' => $result['userDefined'],

				// schemas currently active
				'schemas' => $result['schemas'],
			]
		];

		// submission id
		$sid = time();
		\VisualData::setSessionData( $sid, $obj );

		// *** the following reloads the origin page as script (with a query)
		// thus ensuring that is associated with the submission data
		if ( !empty( $data['options']['origin-url'] ) ) {
			header( 'Location: ' . wfAppendQuery( $data['options']['origin-url'], [ 'sid' => $sid ] ) );

		// backward compatibility
		} else {
			$title_ = TitleClass::newFromText( $data['options']['origin-page'] );
			$url = $title_->getLinkURL( [ 'sid' => $sid ] );
			header( 'Location: ' . $url );
		}

		// *** the following do not seem necessary
		// $this->getOutput()->redirect( $data['options']['origin-url'] );
		// $mediaWiki = new MediaWiki();
		// $mediaWiki->restInPeace();
	}

}
