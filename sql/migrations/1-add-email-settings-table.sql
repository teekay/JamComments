CREATE TABLE account_email_settings(id CHARACTER(36) NOT NULL PRIMARY KEY, account_id CHARACTER(36) NOT NULL REFERENCES accounts(id), notify_on_comments BOOLEAN DEFAULT false, send_comments_digest BOOLEAN DEFAULT false);
INSERT INTO account_email_settings (id, account_id) SELECT gen_random_uuid() as id, id as account_id from accounts;