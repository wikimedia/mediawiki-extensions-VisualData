<?php

$IP = getenv( 'MW_INSTALL_PATH' );
if ( $IP === false ) {
	$IP = __DIR__ . '/../../..';
}
require_once "$IP/maintenance/Maintenance.php";

/*
 * this script is intended to advanced users who
 * need to create their own scripts to handle
 * json-data
*/

class ProcessData extends Maintenance {

	/** @var User */
	private $user;

	public function __construct() {
		parent::__construct();
		$this->addDescription( 'custom scripts' );
		$this->requireExtension( 'VisualData' );

		// name,  description, required = false,
		//	withArg = false, shortName = false, multiOccurrence = false
		//	$this->addOption( 'format', 'import format (csv or json)', true, true );

		$this->addOption( 'script', 'script', false, true );
	}

	/**
	 * inheritDoc
	 */
	public function execute() {
		$scriptName = $this->getOption( 'script' );
		$this->user = User::newSystemUser( 'Maintenance script', [ 'steal' => true ] );

		if ( !empty( $scriptName ) ) {
			$this->$scriptName();
		}
	}

	/**
	 * add more scripts as needed, call them through the parameter
	 */
	private function myScript() {
		echo 'I\'m myScript' . PHP_EOL;

		// schema name
		$schema = '';

		// e.g. [[name::+]]
		$query = '';

		// leave empty to retrieve all printouts, if
		// they are too many use the params printouts-from-conditions = true
		$printouts = [];

		// use an high limit (default is 100)
		$params = [
			'limit' => 5000
		];

		$callback = static function ( $title, $data, $categories ) {
			// edit returned data, they will be automatically saved
			// in the same article if edited
			return $data;
		};

		$updated = \VisualData::editDataCallback( $this->user, $schema, $query, $printouts, $params, $callback );

		foreach ( $updated as $titleText ) {
			echo "$titleText has been updated" . PHP_EOL;
		}
	}

}

$maintClass = ProcessData::class;
require_once RUN_MAINTENANCE_IF_MAIN;
