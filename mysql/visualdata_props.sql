--
-- Table structure
--

CREATE TABLE IF NOT EXISTS /*_*/visualdata_props (
	`id` int(11) NOT NULL,
	`schema_id` int(11) NOT NULL,
	`table_id` int(11) NOT NULL,
	`path` TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
	`path_parent` TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
	`path_no_index` TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
	`updated_at` datetime NOT NULL,
	`created_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Indexes
--
ALTER TABLE /*_*/visualdata_props
	ADD PRIMARY KEY (`id`);

ALTER TABLE /*_*/visualdata_props
	ADD INDEX `schema_id` (`schema_id`);

ALTER TABLE /*_*/visualdata_props
	ADD INDEX `table_id` (`table_id`);

ALTER TABLE /*_*/visualdata_props
	ADD INDEX `path_parent` (`path_parent` (255));

ALTER TABLE /*_*/visualdata_props
	ADD INDEX `path_no_index` (`path_no_index` (255));

ALTER TABLE /*_*/visualdata_props
	ADD INDEX `index_1` (`path_parent`(255), `path_no_index`(255));

ALTER TABLE /*_*/visualdata_props
	ADD INDEX `index_2` (`path_no_index`(255), `path_parent`(255));
	
ALTER TABLE /*_*/visualdata_props
	ADD UNIQUE INDEX `index_3` (`schema_id`, `path`(255));

--
-- AUTO_INCREMENT
--
ALTER TABLE /*_*/visualdata_props
	MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
