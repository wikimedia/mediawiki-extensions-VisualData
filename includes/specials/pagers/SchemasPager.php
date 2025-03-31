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

namespace MediaWiki\Extension\VisualData\Pagers;

use Linker;
use MediaWiki\Extension\VisualData\Aliases\Title as TitleClass;
use MediaWiki\Linker\LinkRenderer;
use MWException;
use ParserOutput;
use TablePager;

class SchemasPager extends TablePager {

	/** @var request */
	private $request;

	/** @var parentClass */
	private $parentClass;

	// @IMPORTANT!, otherwise the pager won't show !
	/** @var mLimit */
	public $mLimit = 20;

	/**
	 * @param SpecialVisualDataBrowse $parentClass
	 * @param Request $request
	 * @param LinkRenderer $linkRenderer
	 */
	public function __construct( $parentClass, $request, LinkRenderer $linkRenderer ) {
		parent::__construct( $parentClass->getContext(), $linkRenderer );

		$this->request = $request;
		$this->parentClass = $parentClass;
	}

	/**
	 * @inheritDoc
	 */
	public function getFullOutput() {
		$navigation = $this->getNavigationBar();
		// $body = parent::getBody();

		$parentParent = get_parent_class( get_parent_class( $this ) );
		$body = $parentParent::getBody();

		$pout = new ParserOutput;
		// $navigation .
		$pout->setText( $body . $navigation );
		$pout->addModuleStyles( $this->getModuleStyles() );
		return $pout;
	}

	/**
	 * @param IResultWrapper $result
	 */
	public function preprocessResults( $result ) {
	}

	/**
	 * @return array
	 */
	protected function getFieldNames() {
		$headers = [
			'page_id' => 'visualdata-special-browse-pager-header-pagetitle',

			// @TODO add edit action (through Ajax)
			// 'actions' => 'visualdata-special-browse-pager-header-actions',
		];

		foreach ( $headers as $key => $val ) {
			$headers[$key] = $this->msg( $val )->text();
		}

		return $headers;
	}

	/**
	 * @param string $field
	 * @param string $value
	 * @return string HTML
	 * @throws MWException
	 */
	public function formatValue( $field, $value ) {
		/** @var object $row */
		$row = $this->mCurrentRow;
		$linkRenderer = $this->getLinkRenderer();

		switch ( $field ) {

			case 'page_id':
				// error, page_id is 0 for new articles
				if ( !$row->page_id ) {
					$formatted = '';
				} else {
					$title = TitleClass::newFromID( $row->page_id );
					$formatted = Linker::link( $title, $title->getFullText() );
				}
				break;

			case 'actions':
				// $link = '<span class="mw-ui-button mw-ui-progressive">edit</span>';
				// $formatted = Linker::link( $title, $link, [], $query );
				break;

			default:
				throw new MWException( "Unknown field '$field'" );
		}

		return $formatted;
	}

	/**
	 * @return array
	 */
	public function getQueryInfo() {
		$dbr = \VisualData::getDB( DB_REPLICA );
		$ret = [];
		$conds = [];
		$join_conds = [];
		$options = [];

		$tables = [ $dbr->tableName( 'page' ) ];
		$fields = [ 'page_namespace', 'page_title', 'page_id' ];
		$conds['page_namespace'] = NS_VISUALDATASCHEMA;

		$ret['tables'] = $tables;
		$ret['fields'] = $fields;
		$ret['join_conds'] = $join_conds;
		$ret['conds'] = $conds;
		$ret['options'] = $options;

		return $ret;
	}

	/**
	 * @return string
	 */
	protected function getTableClass() {
		return parent::getTableClass() . ' visualdata-special-browse-pager-table';
	}

	/**
	 * @return string
	 */
	public function getIndexField() {
		return 'page_title';
	}

	/**
	 * @return string
	 */
	public function getDefaultSort() {
		return 'page_title';
	}

	/**
	 * @param string $field
	 * @return bool
	 */
	protected function isFieldSortable( $field ) {
		// @see here https://doc.wikimedia.org/mediawiki-core/
		// 'USE INDEX' => ( version_compare( MW_VERSION, '1.36', '<' ) ? 'name_title' : 'page_name_title' ),

		// return false;
	}
}
