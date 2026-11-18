-- CONTAS DE DEMONSTRAÇÃO (senha de todas: Demo@2026)
--   Autoridade: helena.duarte@prefeitura.exemplo.br
--   Autoridade: carlos.mendes@prefeitura.exemplo.br
--   Morador:    ana.souza@email.exemplo.br  (e os demais moradores seed)
--   Hash: Base64(SHA-256(salt || senha)), salt de 16 bytes em Base64.

BEGIN
FOR v IN (SELECT view_name FROM user_views WHERE view_name = 'ACTIVE_PROPOSALS') LOOP
        EXECUTE IMMEDIATE 'DROP VIEW ' || v.view_name;
END LOOP;
FOR t IN (SELECT table_name FROM user_tables
               WHERE table_name IN ('PROPOSAL_STATUS_HISTORY', 'OFFICIAL_RESPONSES', 'VOTES',
                                    'PROPOSAL_CATEGORIES', 'PROPOSALS', 'CATEGORIES',
                                    'USERS', 'ADDRESSES', 'SYSTEM_SETTINGS')) LOOP
        EXECUTE IMMEDIATE 'DROP TABLE ' || t.table_name || ' CASCADE CONSTRAINTS PURGE';
END LOOP;
END;
/

CREATE TABLE addresses (
                           id            VARCHAR2(36)        NOT NULL,
                           street        VARCHAR2(120 CHAR)  NOT NULL,
                           street_number VARCHAR2(10 CHAR)   NOT NULL,
                           complement    VARCHAR2(60 CHAR),
                           neighborhood  VARCHAR2(80 CHAR)   NOT NULL,
                           city          VARCHAR2(80 CHAR)   NOT NULL,
                           state         CHAR(2)             NOT NULL,
                           zip_code      CHAR(8)             NOT NULL,
                           latitude      NUMBER(9,6),
                           longitude     NUMBER(9,6),
                           created_at    TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL,
                           updated_at    TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL,
                           CONSTRAINT pk_addresses PRIMARY KEY (id),
                           CONSTRAINT ck_addresses_zip CHECK (REGEXP_LIKE(zip_code, '^[0-9]{8}$'))
);

CREATE TABLE users (
                       id            VARCHAR2(36)        NOT NULL,
                       first_name    VARCHAR2(60 CHAR)   NOT NULL,
                       last_name     VARCHAR2(80 CHAR)   NOT NULL,
                       email         VARCHAR2(160 CHAR)  NOT NULL,
                       password_hash VARCHAR2(64)        NOT NULL,
                       password_salt VARCHAR2(64)        NOT NULL,
                       role          VARCHAR2(20)        NOT NULL,
                       job_title     VARCHAR2(100 CHAR),
                       department    VARCHAR2(100 CHAR),
                       address_id    VARCHAR2(36)        NOT NULL,
                       created_at    TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL,
                       updated_at    TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL,
                       CONSTRAINT pk_users PRIMARY KEY (id),
                       CONSTRAINT uq_users_email UNIQUE (email),
                       CONSTRAINT fk_users_address FOREIGN KEY (address_id) REFERENCES addresses (id),
                       CONSTRAINT ck_users_role CHECK (role IN ('RESIDENT', 'AUTHORITY')),
                       CONSTRAINT ck_users_email_lower CHECK (email = LOWER(email)),
                       CONSTRAINT ck_users_authority_fields CHECK (role = 'AUTHORITY'
                           OR (job_title IS NULL AND department IS NULL))
);

CREATE TABLE categories (
                            id            VARCHAR2(36)        NOT NULL,
                            name          VARCHAR2(60 CHAR)   NOT NULL,
                            slug          VARCHAR2(60)        NOT NULL,
                            created_by    VARCHAR2(36)        NOT NULL,
                            created_at    TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL,
                            updated_at    TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL,
                            CONSTRAINT pk_categories PRIMARY KEY (id),
                            CONSTRAINT uq_categories_slug UNIQUE (slug),
                            CONSTRAINT fk_categories_creator FOREIGN KEY (created_by) REFERENCES users (id),
                            CONSTRAINT ck_categories_slug CHECK (REGEXP_LIKE(slug, '^[a-z0-9]+(-[a-z0-9]+)*$'))
);

CREATE TABLE proposals (
                           id            VARCHAR2(36)        NOT NULL,
                           title         VARCHAR2(120 CHAR)  NOT NULL,
                           description   VARCHAR2(500 CHAR)  NOT NULL,
                           body          VARCHAR2(4000 CHAR) NOT NULL,
                           status        VARCHAR2(30) DEFAULT 'COLLECTING_VOTES' NOT NULL,
                           created_by    VARCHAR2(36)        NOT NULL,
                           archived_at   TIMESTAMP,
                           archived_by   VARCHAR2(36),
                           created_at    TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL,
                           updated_at    TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL,
                           CONSTRAINT pk_proposals PRIMARY KEY (id),
                           CONSTRAINT fk_proposals_creator FOREIGN KEY (created_by) REFERENCES users (id),
                           CONSTRAINT fk_proposals_archiver FOREIGN KEY (archived_by) REFERENCES users (id),
                           CONSTRAINT ck_proposals_status CHECK (status IN ('COLLECTING_VOTES', 'AWAITING_REVIEW', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'IN_PROGRESS', 'COMPLETED')),
                           CONSTRAINT ck_proposals_archive CHECK (
                               (archived_at IS NULL AND archived_by IS NULL)
                                   OR (archived_at IS NOT NULL AND archived_by IS NOT NULL)),
                           CONSTRAINT ck_proposals_rejected CHECK (status <> 'REJECTED' OR archived_at IS NOT NULL)
);

CREATE TABLE proposal_categories (
                                     proposal_id   VARCHAR2(36)        NOT NULL,
                                     category_id   VARCHAR2(36)        NOT NULL,
                                     created_at    TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL,
                                     CONSTRAINT pk_proposal_categories PRIMARY KEY (proposal_id, category_id),
                                     CONSTRAINT fk_propcat_proposal FOREIGN KEY (proposal_id) REFERENCES proposals (id) ON DELETE CASCADE,
                                     CONSTRAINT fk_propcat_category FOREIGN KEY (category_id) REFERENCES categories (id)
);

CREATE TABLE votes (
                       id            VARCHAR2(36)        NOT NULL,
                       user_id       VARCHAR2(36)        NOT NULL,
                       proposal_id   VARCHAR2(36)        NOT NULL,
                       vote_type     VARCHAR2(10)        NOT NULL,
                       address_id    VARCHAR2(36)        NOT NULL,
                       created_at    TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL,
                       updated_at    TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL,
                       CONSTRAINT pk_votes PRIMARY KEY (id),
                       CONSTRAINT uq_votes_user_proposal UNIQUE (user_id, proposal_id),
                       CONSTRAINT fk_votes_user FOREIGN KEY (user_id) REFERENCES users (id),
                       CONSTRAINT fk_votes_proposal FOREIGN KEY (proposal_id) REFERENCES proposals (id),
                       CONSTRAINT fk_votes_address FOREIGN KEY (address_id) REFERENCES addresses (id),
                       CONSTRAINT ck_votes_type CHECK (vote_type IN ('IN_FAVOR', 'AGAINST'))
);

CREATE TABLE official_responses (
                                    id              VARCHAR2(36)        NOT NULL,
                                    proposal_id     VARCHAR2(36)        NOT NULL,
                                    created_by      VARCHAR2(36)        NOT NULL,
                                    content         VARCHAR2(2000 CHAR) NOT NULL,
                                    proposal_status VARCHAR2(30)        NOT NULL,
                                    created_at      TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL,
                                    updated_at      TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL,
                                    CONSTRAINT pk_official_responses PRIMARY KEY (id),
                                    CONSTRAINT fk_ofr_proposal FOREIGN KEY (proposal_id) REFERENCES proposals (id),
                                    CONSTRAINT fk_ofr_creator FOREIGN KEY (created_by) REFERENCES users (id),
                                    CONSTRAINT ck_ofr_status CHECK (proposal_status IN ('APPROVED', 'REJECTED', 'IN_PROGRESS', 'COMPLETED'))
);

CREATE TABLE proposal_status_history (
                                         id            VARCHAR2(36)        NOT NULL,
                                         proposal_id   VARCHAR2(36)        NOT NULL,
                                         from_status   VARCHAR2(30),
                                         to_status     VARCHAR2(30)        NOT NULL,
                                         changed_by    VARCHAR2(36),
                                         created_at    TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL,
                                         updated_at    TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL,
                                         CONSTRAINT pk_proposal_status_history PRIMARY KEY (id),
                                         CONSTRAINT fk_psh_proposal FOREIGN KEY (proposal_id) REFERENCES proposals (id),
                                         CONSTRAINT fk_psh_changer FOREIGN KEY (changed_by) REFERENCES users (id),
                                         CONSTRAINT ck_psh_from CHECK (from_status IS NULL OR from_status IN ('COLLECTING_VOTES', 'AWAITING_REVIEW', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'IN_PROGRESS', 'COMPLETED')),
                                         CONSTRAINT ck_psh_to CHECK (to_status IN ('COLLECTING_VOTES', 'AWAITING_REVIEW', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'IN_PROGRESS', 'COMPLETED'))
);

CREATE TABLE system_settings (
                                 id            VARCHAR2(36)        NOT NULL,
                                 setting_key   VARCHAR2(60)        NOT NULL,
                                 setting_value NUMBER(10,2)        NOT NULL,
                                 description   VARCHAR2(200 CHAR),
                                 created_at    TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL,
                                 updated_at    TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL,
                                 CONSTRAINT pk_system_settings PRIMARY KEY (id),
                                 CONSTRAINT uq_system_settings_key UNIQUE (setting_key),
                                 CONSTRAINT ck_settings_value CHECK (setting_value >= 0)
);

CREATE INDEX idx_users_address        ON users (address_id);
CREATE INDEX idx_categories_creator   ON categories (created_by);
CREATE INDEX idx_proposals_creator    ON proposals (created_by);
CREATE INDEX idx_proposals_status     ON proposals (status, archived_at);
CREATE INDEX idx_propcat_category     ON proposal_categories (category_id);
CREATE INDEX idx_votes_proposal       ON votes (proposal_id);
CREATE INDEX idx_votes_address        ON votes (address_id);
CREATE INDEX idx_ofr_proposal         ON official_responses (proposal_id);
CREATE INDEX idx_psh_proposal         ON proposal_status_history (proposal_id);

CREATE OR REPLACE VIEW active_proposals AS
SELECT id, title, description, body, status, created_by, created_at, updated_at
FROM proposals
WHERE archived_at IS NULL;

INSERT INTO system_settings (id, setting_key, setting_value, description, created_at, updated_at) VALUES ('ffe1205a-90da-44b5-a951-b26d4f196f36', 'quorum_percentage', 10, 'Percentual do total de moradores cadastrados que precisa votar (quórum)', TIMESTAMP '2026-06-01 09:00:00', TIMESTAMP '2026-06-01 09:00:00');
INSERT INTO system_settings (id, setting_key, setting_value, description, created_at, updated_at) VALUES ('d35403ac-aa42-4c28-a26d-95432a7adf34', 'min_votes_floor', 5, 'Piso mínimo de votos exigido para o quórum', TIMESTAMP '2026-06-01 09:00:00', TIMESTAMP '2026-06-01 09:00:00');
INSERT INTO system_settings (id, setting_key, setting_value, description, created_at, updated_at) VALUES ('178a0ba8-97f6-44fc-a7c4-782cc9f130bc', 'approval_percentage', 60, 'Percentual mínimo de votos a favor sobre os votos computados', TIMESTAMP '2026-06-01 09:00:00', TIMESTAMP '2026-06-01 09:00:00');
INSERT INTO system_settings (id, setting_key, setting_value, description, created_at, updated_at) VALUES ('48cf190d-ad01-4ec3-ba53-bd37d489d103', 'stale_after_days', 90, 'Dias sem atingir o limiar até a proposta poder ser arquivada', TIMESTAMP '2026-06-01 09:00:00', TIMESTAMP '2026-06-01 09:00:00');
INSERT INTO system_settings (id, setting_key, setting_value, description, created_at, updated_at) VALUES ('1f1cb528-36ba-48b9-97cf-56f29cc084b4', 'max_categories_per_proposal', 3, 'Máximo de categorias por proposta', TIMESTAMP '2026-06-01 09:00:00', TIMESTAMP '2026-06-01 09:00:00');

INSERT INTO addresses (id, street, street_number, complement, neighborhood, city, state, zip_code, created_at, updated_at) VALUES ('e05251ab-2842-4cc3-bd07-460f0436044d', 'Praça das Acácias', '1', 'Gabinete 3', 'Jardim das Acácias', 'São Paulo', 'SP', '04010100', TIMESTAMP '2026-06-01 09:00:00', TIMESTAMP '2026-06-01 09:00:00');  -- Helena Duarte
INSERT INTO addresses (id, street, street_number, complement, neighborhood, city, state, zip_code, created_at, updated_at) VALUES ('01e85a18-a98d-4c5b-8d86-fdc87bc5522e', 'Praça das Acácias', '1', 'Sala 12', 'Jardim das Acácias', 'São Paulo', 'SP', '04010100', TIMESTAMP '2026-06-01 09:00:00', TIMESTAMP '2026-06-01 09:00:00');  -- Carlos Mendes
INSERT INTO addresses (id, street, street_number, complement, neighborhood, city, state, zip_code, created_at, updated_at) VALUES ('b225823e-be8f-4fda-858a-07ede4310f01', 'Rua das Palmeiras', '45', NULL, 'Jardim das Acácias', 'São Paulo', 'SP', '04010200', TIMESTAMP '2026-06-01 09:00:00', TIMESTAMP '2026-06-01 09:00:00');  -- Ana Souza
INSERT INTO addresses (id, street, street_number, complement, neighborhood, city, state, zip_code, created_at, updated_at) VALUES ('26104c2d-5d61-43dc-9f3e-08fa5f0750ed', 'Rua dos Ipês', '120', 'Apto 2', 'Jardim das Acácias', 'São Paulo', 'SP', '04010300', TIMESTAMP '2026-06-01 09:00:00', TIMESTAMP '2026-06-01 09:00:00');  -- Bruno Lima
INSERT INTO addresses (id, street, street_number, complement, neighborhood, city, state, zip_code, created_at, updated_at) VALUES ('1897d142-738c-43f7-acd1-81e65b37bfde', 'Rua das Palmeiras', '210', NULL, 'Jardim das Acácias', 'São Paulo', 'SP', '04010200', TIMESTAMP '2026-06-01 09:00:00', TIMESTAMP '2026-06-01 09:00:00');  -- Carla Ribeiro
INSERT INTO addresses (id, street, street_number, complement, neighborhood, city, state, zip_code, created_at, updated_at) VALUES ('6f404fad-ccd5-4b1a-8c1e-0b11dc5134da', 'Avenida Central', '800', 'Bloco B', 'Jardim das Acácias', 'São Paulo', 'SP', '04020100', TIMESTAMP '2026-06-01 09:00:00', TIMESTAMP '2026-06-01 09:00:00');  -- Diego Alves
INSERT INTO addresses (id, street, street_number, complement, neighborhood, city, state, zip_code, created_at, updated_at) VALUES ('da9b52b8-62c9-4d00-8bba-e10ff33acd72', 'Rua dos Ipês', '77', NULL, 'Jardim das Acácias', 'São Paulo', 'SP', '04010300', TIMESTAMP '2026-06-01 09:00:00', TIMESTAMP '2026-06-01 09:00:00');  -- Elisa Ferreira
INSERT INTO addresses (id, street, street_number, complement, neighborhood, city, state, zip_code, created_at, updated_at) VALUES ('ee6d0aa8-6977-4524-a4fc-2b0f28cb4ad7', 'Avenida Central', '1250', 'Apto 31', 'Jardim das Acácias', 'São Paulo', 'SP', '04020100', TIMESTAMP '2026-06-01 09:00:00', TIMESTAMP '2026-06-01 09:00:00');  -- Felipe Costa
INSERT INTO addresses (id, street, street_number, complement, neighborhood, city, state, zip_code, created_at, updated_at) VALUES ('edf9b3fe-442e-4aa0-8d4a-f69455e28a73', 'Rua das Acácias', '33', NULL, 'Jardim das Acácias', 'São Paulo', 'SP', '04020200', TIMESTAMP '2026-06-01 09:00:00', TIMESTAMP '2026-06-01 09:00:00');  -- Gabriela Nunes
INSERT INTO addresses (id, street, street_number, complement, neighborhood, city, state, zip_code, created_at, updated_at) VALUES ('06522629-60f5-44d0-9cd8-a6085c82a973', 'Rua das Acácias', '158', NULL, 'Jardim das Acácias', 'São Paulo', 'SP', '04020200', TIMESTAMP '2026-06-01 09:00:00', TIMESTAMP '2026-06-01 09:00:00');  -- Henrique Rocha

INSERT INTO users (id, first_name, last_name, email, password_hash, password_salt, role, job_title, department, address_id, created_at, updated_at) VALUES ('4c33c062-8def-473a-bca8-d511579e6cc9', 'Helena', 'Duarte', 'helena.duarte@prefeitura.exemplo.br', 'M+EvI1YtXk68zIHJZ3kuF6GNbOU5vtAjM1O4HkEwkQo=', 'fGXtWSmFK+Fi9S09vk9j2w==', 'AUTHORITY', 'Vereadora', 'Câmara Municipal', 'e05251ab-2842-4cc3-bd07-460f0436044d', TIMESTAMP '2026-06-01 09:00:00', TIMESTAMP '2026-06-01 09:00:00');
INSERT INTO users (id, first_name, last_name, email, password_hash, password_salt, role, job_title, department, address_id, created_at, updated_at) VALUES ('c2225dc9-96f0-4e7a-ab09-113e7f776d5f', 'Carlos', 'Mendes', 'carlos.mendes@prefeitura.exemplo.br', 'F6Jn1GNkVOFWYJNIJLjySspjQuc7Wq6DIdf8KUG2avc=', 'MbqLFI+jKTjdAYy/IVt7AA==', 'AUTHORITY', 'Secretário de Zeladoria Urbana', 'Secretaria de Zeladoria', '01e85a18-a98d-4c5b-8d86-fdc87bc5522e', TIMESTAMP '2026-06-01 09:00:00', TIMESTAMP '2026-06-01 09:00:00');
INSERT INTO users (id, first_name, last_name, email, password_hash, password_salt, role, job_title, department, address_id, created_at, updated_at) VALUES ('71e111a9-adbb-4e38-9776-3631b9b2f3b5', 'Ana', 'Souza', 'ana.souza@email.exemplo.br', 'h8HdVHM/NopHY2moheJkBWB8/qKWDCjUNx1qmHH1u4U=', 'ESvK2R0AReKQ6aVCNwFBSg==', 'RESIDENT', NULL, NULL, 'b225823e-be8f-4fda-858a-07ede4310f01', TIMESTAMP '2026-06-01 09:00:00', TIMESTAMP '2026-06-01 09:00:00');
INSERT INTO users (id, first_name, last_name, email, password_hash, password_salt, role, job_title, department, address_id, created_at, updated_at) VALUES ('e372b44f-6771-44bf-aabe-d3411d7f7487', 'Bruno', 'Lima', 'bruno.lima@email.exemplo.br', '2W4hM5lSsPddIHyY0ke1Zhd2/IzGGnRcUdsXP3cJZ4w=', '+KtYxDx5gc/CEm/tlU2tRg==', 'RESIDENT', NULL, NULL, '26104c2d-5d61-43dc-9f3e-08fa5f0750ed', TIMESTAMP '2026-06-01 09:00:00', TIMESTAMP '2026-06-01 09:00:00');
INSERT INTO users (id, first_name, last_name, email, password_hash, password_salt, role, job_title, department, address_id, created_at, updated_at) VALUES ('754840d7-8b19-43bf-874b-ef7b33e1aa1f', 'Carla', 'Ribeiro', 'carla.ribeiro@email.exemplo.br', 'xZsJWHVn22V9VMSx+YkiPHzB8yMdrgCfFTiRlCvhWuw=', '831fWY7Va4YoNuQ7l/ZYlg==', 'RESIDENT', NULL, NULL, '1897d142-738c-43f7-acd1-81e65b37bfde', TIMESTAMP '2026-06-01 09:00:00', TIMESTAMP '2026-06-01 09:00:00');
INSERT INTO users (id, first_name, last_name, email, password_hash, password_salt, role, job_title, department, address_id, created_at, updated_at) VALUES ('f9322f82-6a45-4b9b-937f-82683d3930d9', 'Diego', 'Alves', 'diego.alves@email.exemplo.br', 'wzTTQKkrBn67ZjzmnqnDifN4F+fjOg5B7CVX59NPTyw=', 'r4+/iBtW8LpkMB6TzGTcsQ==', 'RESIDENT', NULL, NULL, '6f404fad-ccd5-4b1a-8c1e-0b11dc5134da', TIMESTAMP '2026-06-01 09:00:00', TIMESTAMP '2026-06-01 09:00:00');
INSERT INTO users (id, first_name, last_name, email, password_hash, password_salt, role, job_title, department, address_id, created_at, updated_at) VALUES ('4b292ded-b5d7-4551-a806-21f7ba62e9c5', 'Elisa', 'Ferreira', 'elisa.ferreira@email.exemplo.br', 'iw93HFLsVuDflC63+eNwUenljRtMccjRK/0Kk7sRsOg=', 'mwwPhKEExzws8ufs0ZNGBg==', 'RESIDENT', NULL, NULL, 'da9b52b8-62c9-4d00-8bba-e10ff33acd72', TIMESTAMP '2026-06-01 09:00:00', TIMESTAMP '2026-06-01 09:00:00');
INSERT INTO users (id, first_name, last_name, email, password_hash, password_salt, role, job_title, department, address_id, created_at, updated_at) VALUES ('0bd69764-6100-4f99-b035-d2f3e11f2c5a', 'Felipe', 'Costa', 'felipe.costa@email.exemplo.br', 'HYq4zoi+dV4gONaMjGwOaktICSCCaUW9sira5ruuXY4=', 'O2YFrWMc5C7hw1TAIkUoVw==', 'RESIDENT', NULL, NULL, 'ee6d0aa8-6977-4524-a4fc-2b0f28cb4ad7', TIMESTAMP '2026-06-01 09:00:00', TIMESTAMP '2026-06-01 09:00:00');
INSERT INTO users (id, first_name, last_name, email, password_hash, password_salt, role, job_title, department, address_id, created_at, updated_at) VALUES ('fc9c42d9-8e17-4ffb-858e-4a27828f0885', 'Gabriela', 'Nunes', 'gabriela.nunes@email.exemplo.br', 'kJLrC/PAvy0ZmQu5AIZZiNF/5QQM9khWpSfxTLlZjdA=', 'pU35tOyOkULf8sT8zaHudQ==', 'RESIDENT', NULL, NULL, 'edf9b3fe-442e-4aa0-8d4a-f69455e28a73', TIMESTAMP '2026-06-01 09:00:00', TIMESTAMP '2026-06-01 09:00:00');
INSERT INTO users (id, first_name, last_name, email, password_hash, password_salt, role, job_title, department, address_id, created_at, updated_at) VALUES ('749a6236-5948-46dc-b20b-c75dafee381b', 'Henrique', 'Rocha', 'henrique.rocha@email.exemplo.br', '9SBAEf78urvUIWGshK7TeNTw5Vm65CuislBujpk1JFg=', '6wjxkxNFrUAUQN3d8FxwJA==', 'RESIDENT', NULL, NULL, '06522629-60f5-44d0-9cd8-a6085c82a973', TIMESTAMP '2026-06-01 09:00:00', TIMESTAMP '2026-06-01 09:00:00');

INSERT INTO categories (id, name, slug, created_by, created_at, updated_at) VALUES ('bd45419a-a5c7-4767-a0a2-9912f20d9b14', 'Saúde', 'saude', '4c33c062-8def-473a-bca8-d511579e6cc9', TIMESTAMP '2026-06-01 09:00:00', TIMESTAMP '2026-06-01 09:00:00');
INSERT INTO categories (id, name, slug, created_by, created_at, updated_at) VALUES ('cacb2782-3c84-42ae-8729-9a490e8c819b', 'Educação', 'educacao', '4c33c062-8def-473a-bca8-d511579e6cc9', TIMESTAMP '2026-06-01 09:00:00', TIMESTAMP '2026-06-01 09:00:00');
INSERT INTO categories (id, name, slug, created_by, created_at, updated_at) VALUES ('65f1fbc0-994e-4bdf-8522-e1a534c139b6', 'Transporte e Mobilidade', 'transporte-e-mobilidade', '4c33c062-8def-473a-bca8-d511579e6cc9', TIMESTAMP '2026-06-01 09:00:00', TIMESTAMP '2026-06-01 09:00:00');
INSERT INTO categories (id, name, slug, created_by, created_at, updated_at) VALUES ('ecc4d565-13ab-477d-917b-580cbf66af72', 'Segurança', 'seguranca', '4c33c062-8def-473a-bca8-d511579e6cc9', TIMESTAMP '2026-06-01 09:00:00', TIMESTAMP '2026-06-01 09:00:00');
INSERT INTO categories (id, name, slug, created_by, created_at, updated_at) VALUES ('0585d908-3669-4e66-aaf5-122279fb3fb4', 'Meio Ambiente', 'meio-ambiente', '4c33c062-8def-473a-bca8-d511579e6cc9', TIMESTAMP '2026-06-01 09:00:00', TIMESTAMP '2026-06-01 09:00:00');
INSERT INTO categories (id, name, slug, created_by, created_at, updated_at) VALUES ('b0df5369-1b32-4107-a4d7-b7de981b38f1', 'Infraestrutura e Zeladoria', 'infraestrutura-e-zeladoria', '4c33c062-8def-473a-bca8-d511579e6cc9', TIMESTAMP '2026-06-01 09:00:00', TIMESTAMP '2026-06-01 09:00:00');
INSERT INTO categories (id, name, slug, created_by, created_at, updated_at) VALUES ('bb6aba95-451b-40a7-862f-690ea63117bc', 'Cultura e Lazer', 'cultura-e-lazer', '4c33c062-8def-473a-bca8-d511579e6cc9', TIMESTAMP '2026-06-01 09:00:00', TIMESTAMP '2026-06-01 09:00:00');
INSERT INTO categories (id, name, slug, created_by, created_at, updated_at) VALUES ('2fb2a783-6c52-46d6-8cf0-f487efefe3f2', 'Saneamento', 'saneamento', '4c33c062-8def-473a-bca8-d511579e6cc9', TIMESTAMP '2026-06-01 09:00:00', TIMESTAMP '2026-06-01 09:00:00');

-- P6 (COLLECTING_VOTES) - autor: Felipe Costa
INSERT INTO proposals (id, title, description, body, status, created_by, archived_at, archived_by, created_at, updated_at) VALUES ('d501c4b6-ecba-4430-89a0-a40152b0d6bc', 'Ciclovia ligando o bairro à estação de trem', 'Criar uma ciclovia segura do bairro até a estação, incentivando o uso da bicicleta.', 'Muitos moradores usam a bicicleta para chegar à estação de trem, mas precisam dividir a pista com carros e ônibus em um trecho sem acostamento. Propomos uma ciclovia segregada ligando o bairro à estação, com sinalização e iluminação adequadas e um bicicletário na chegada. A obra reduz o risco de acidentes, incentiva um meio de transporte barato e sustentável e diminui o tráfego de carros nas ruas do bairro.', 'COLLECTING_VOTES', '0bd69764-6100-4f99-b035-d2f3e11f2c5a', NULL, NULL, TIMESTAMP '2026-07-06 11:00:00', TIMESTAMP '2026-07-06 11:00:00');
-- P5 (COMPLETED) - autor: Elisa Ferreira
INSERT INTO proposals (id, title, description, body, status, created_by, archived_at, archived_by, created_at, updated_at) VALUES ('c4197a10-20b2-4ad5-933f-2ef8337565e1', 'Lixeiras de coleta seletiva nas esquinas do bairro', 'Instalar lixeiras de coleta seletiva nas principais esquinas e na praça.', 'Hoje o bairro tem poucas lixeiras e nenhuma separa o lixo reciclável, o que faz o material acabar misturado nas calçadas e nos bueiros. Propomos instalar conjuntos de lixeiras para orgânicos, recicláveis e rejeitos nas principais esquinas e na praça, com identificação por cores e informações simples sobre o que descartar em cada uma. A medida reduz o entupimento de bueiros, aumenta a reciclagem e melhora a limpeza das ruas.', 'COMPLETED', '4b292ded-b5d7-4551-a806-21f7ba62e9c5', NULL, NULL, TIMESTAMP '2026-08-03 09:30:00', TIMESTAMP '2026-10-05 16:00:00');
-- P3 (IN_PROGRESS) - autor: Carla Ribeiro
INSERT INTO proposals (id, title, description, body, status, created_by, archived_at, archived_by, created_at, updated_at) VALUES ('2d6e1376-26e6-4223-bbbd-5fb8e2de5bac', 'Reforma da Praça das Acácias e iluminação em LED', 'Recuperar a praça com novos bancos, calçada acessível e iluminação em LED.', 'A Praça das Acácias tem calçadas quebradas, postes apagados e poucos bancos. À noite ela fica escura e os moradores evitam passar por ali. Propomos recuperar a calçada com piso regular e rampas de acesso, trocar a iluminação por lâmpadas de LED, instalar bancos e lixeiras e podar as árvores que cobrem os postes. A reforma melhora a segurança, a acessibilidade e o uso da praça pela comunidade, e a iluminação de LED reduz o gasto de energia.', 'IN_PROGRESS', '754840d7-8b19-43bf-874b-ef7b33e1aa1f', NULL, NULL, TIMESTAMP '2026-09-14 09:00:00', TIMESTAMP '2026-10-20 10:00:00');
-- P4 (REJECTED) - autor: Diego Alves
INSERT INTO proposals (id, title, description, body, status, created_by, archived_at, archived_by, created_at, updated_at) VALUES ('298cb0f7-8414-45be-ba10-28989c91b091', 'Proibir o estacionamento em toda a Avenida Central', 'Proibir o estacionamento nos dois lados da avenida para liberar uma faixa extra de circulação.', 'A Avenida Central fica congestionada nos horários de pico porque os carros estacionados reduzem a via a uma faixa em cada sentido. Propomos proibir o estacionamento nos dois lados da avenida, em toda a sua extensão, para liberar uma faixa extra de circulação e agilizar o transporte coletivo. A medida reduziria o tempo de deslocamento, mas também afeta o comércio local e os moradores sem garagem, e por isso deve ser debatida.', 'REJECTED', 'f9322f82-6a45-4b9b-937f-82683d3930d9', TIMESTAMP '2026-10-13 15:00:00', 'c2225dc9-96f0-4e7a-ab09-113e7f776d5f', TIMESTAMP '2026-10-01 10:00:00', TIMESTAMP '2026-10-13 15:00:00');
-- P2 (AWAITING_REVIEW) - autor: Bruno Lima
INSERT INTO proposals (id, title, description, body, status, created_by, archived_at, archived_by, created_at, updated_at) VALUES ('3b6b4d85-da92-41da-9c85-c6c2073b7ea8', 'Horta comunitária no terreno baldio da Rua dos Ipês', 'Transformar o terreno abandonado em uma horta comunitária cuidada pelos moradores.', 'O terreno ao lado do número 120 da Rua dos Ipês está abandonado há anos e acumula entulho e mato alto. Propomos transformá-lo em uma horta comunitária, com canteiros cuidados pelos moradores, composteira para os resíduos orgânicos do bairro e um espaço de convivência com bancos. A prefeitura cederia o uso do terreno e forneceria água e as primeiras mudas. A horta melhora a limpeza do local, reduz o descarte irregular e oferece alimentos frescos e atividades para crianças e idosos.', 'AWAITING_REVIEW', 'e372b44f-6771-44bf-aabe-d3411d7f7487', NULL, NULL, TIMESTAMP '2026-11-02 09:15:00', TIMESTAMP '2026-11-04 08:00:00');
-- P1 (COLLECTING_VOTES) - autor: Ana Souza
INSERT INTO proposals (id, title, description, body, status, created_by, archived_at, archived_by, created_at, updated_at) VALUES ('295234f9-f00b-4fa9-8b7c-8f1f5b63a1f6', 'Semáforo no cruzamento da Rua das Palmeiras com a Avenida Central', 'Instalar semáforo com botoeira para pedestres no cruzamento mais movimentado do bairro.', 'O cruzamento da Rua das Palmeiras com a Avenida Central não tem semáforo nem faixa elevada. Nos horários de entrada e saída da escola e do trabalho, pedestres, ciclistas e carros disputam o mesmo espaço, e já houve vários quase-atropelamentos. Propomos a instalação de um semáforo com botoeira e tempo estendido para pedestres, além de sinalização horizontal reforçada e uma faixa elevada. A medida reduz o risco para crianças e idosos e organiza o fluxo de veículos no horário de pico.', 'COLLECTING_VOTES', '71e111a9-adbb-4e38-9776-3631b9b2f3b5', NULL, NULL, TIMESTAMP '2026-11-10 08:30:00', TIMESTAMP '2026-11-10 08:30:00');

INSERT INTO proposal_categories (proposal_id, category_id, created_at) VALUES ('295234f9-f00b-4fa9-8b7c-8f1f5b63a1f6', '65f1fbc0-994e-4bdf-8522-e1a534c139b6', TIMESTAMP '2026-11-10 08:30:00');  -- P1: transporte-e-mobilidade
INSERT INTO proposal_categories (proposal_id, category_id, created_at) VALUES ('295234f9-f00b-4fa9-8b7c-8f1f5b63a1f6', 'ecc4d565-13ab-477d-917b-580cbf66af72', TIMESTAMP '2026-11-10 08:30:00');  -- P1: seguranca
INSERT INTO proposal_categories (proposal_id, category_id, created_at) VALUES ('3b6b4d85-da92-41da-9c85-c6c2073b7ea8', '0585d908-3669-4e66-aaf5-122279fb3fb4', TIMESTAMP '2026-11-02 09:15:00');  -- P2: meio-ambiente
INSERT INTO proposal_categories (proposal_id, category_id, created_at) VALUES ('3b6b4d85-da92-41da-9c85-c6c2073b7ea8', 'bb6aba95-451b-40a7-862f-690ea63117bc', TIMESTAMP '2026-11-02 09:15:00');  -- P2: cultura-e-lazer
INSERT INTO proposal_categories (proposal_id, category_id, created_at) VALUES ('2d6e1376-26e6-4223-bbbd-5fb8e2de5bac', 'b0df5369-1b32-4107-a4d7-b7de981b38f1', TIMESTAMP '2026-09-14 09:00:00');  -- P3: infraestrutura-e-zeladoria
INSERT INTO proposal_categories (proposal_id, category_id, created_at) VALUES ('2d6e1376-26e6-4223-bbbd-5fb8e2de5bac', 'ecc4d565-13ab-477d-917b-580cbf66af72', TIMESTAMP '2026-09-14 09:00:00');  -- P3: seguranca
INSERT INTO proposal_categories (proposal_id, category_id, created_at) VALUES ('298cb0f7-8414-45be-ba10-28989c91b091', '65f1fbc0-994e-4bdf-8522-e1a534c139b6', TIMESTAMP '2026-10-01 10:00:00');  -- P4: transporte-e-mobilidade
INSERT INTO proposal_categories (proposal_id, category_id, created_at) VALUES ('c4197a10-20b2-4ad5-933f-2ef8337565e1', '2fb2a783-6c52-46d6-8cf0-f487efefe3f2', TIMESTAMP '2026-08-03 09:30:00');  -- P5: saneamento
INSERT INTO proposal_categories (proposal_id, category_id, created_at) VALUES ('c4197a10-20b2-4ad5-933f-2ef8337565e1', '0585d908-3669-4e66-aaf5-122279fb3fb4', TIMESTAMP '2026-08-03 09:30:00');  -- P5: meio-ambiente
INSERT INTO proposal_categories (proposal_id, category_id, created_at) VALUES ('d501c4b6-ecba-4430-89a0-a40152b0d6bc', '65f1fbc0-994e-4bdf-8522-e1a534c139b6', TIMESTAMP '2026-07-06 11:00:00');  -- P6: transporte-e-mobilidade
INSERT INTO proposal_categories (proposal_id, category_id, created_at) VALUES ('d501c4b6-ecba-4430-89a0-a40152b0d6bc', '0585d908-3669-4e66-aaf5-122279fb3fb4', TIMESTAMP '2026-07-06 11:00:00');  -- P6: meio-ambiente

INSERT INTO votes (id, user_id, proposal_id, vote_type, address_id, created_at, updated_at) VALUES ('c2ff11e6-bc43-44d7-8c65-042317fd5518', 'e372b44f-6771-44bf-aabe-d3411d7f7487', '295234f9-f00b-4fa9-8b7c-8f1f5b63a1f6', 'IN_FAVOR', '26104c2d-5d61-43dc-9f3e-08fa5f0750ed', TIMESTAMP '2026-11-10 09:00:00', TIMESTAMP '2026-11-10 09:00:00');  -- Bruno -> P1
INSERT INTO votes (id, user_id, proposal_id, vote_type, address_id, created_at, updated_at) VALUES ('6e7b3c6e-67c0-45ec-8849-7c01712f676e', '754840d7-8b19-43bf-874b-ef7b33e1aa1f', '295234f9-f00b-4fa9-8b7c-8f1f5b63a1f6', 'IN_FAVOR', '1897d142-738c-43f7-acd1-81e65b37bfde', TIMESTAMP '2026-11-10 13:00:00', TIMESTAMP '2026-11-10 13:00:00');  -- Carla -> P1
INSERT INTO votes (id, user_id, proposal_id, vote_type, address_id, created_at, updated_at) VALUES ('6193cad1-2130-4da8-8375-63bc1a4bd90b', 'f9322f82-6a45-4b9b-937f-82683d3930d9', '295234f9-f00b-4fa9-8b7c-8f1f5b63a1f6', 'AGAINST', '6f404fad-ccd5-4b1a-8c1e-0b11dc5134da', TIMESTAMP '2026-11-11 08:00:00', TIMESTAMP '2026-11-11 08:00:00');  -- Diego -> P1
INSERT INTO votes (id, user_id, proposal_id, vote_type, address_id, created_at, updated_at) VALUES ('f43e255c-eee7-4dde-a8e8-4e8bed6ddf55', '4b292ded-b5d7-4551-a806-21f7ba62e9c5', '295234f9-f00b-4fa9-8b7c-8f1f5b63a1f6', 'IN_FAVOR', 'da9b52b8-62c9-4d00-8bba-e10ff33acd72', TIMESTAMP '2026-11-12 10:00:00', TIMESTAMP '2026-11-12 10:00:00');  -- Elisa -> P1
INSERT INTO votes (id, user_id, proposal_id, vote_type, address_id, created_at, updated_at) VALUES ('bb6be0d2-525c-4405-bd80-dd82d30343ed', '71e111a9-adbb-4e38-9776-3631b9b2f3b5', '3b6b4d85-da92-41da-9c85-c6c2073b7ea8', 'IN_FAVOR', 'b225823e-be8f-4fda-858a-07ede4310f01', TIMESTAMP '2026-11-02 10:00:00', TIMESTAMP '2026-11-02 10:00:00');  -- Ana -> P2
INSERT INTO votes (id, user_id, proposal_id, vote_type, address_id, created_at, updated_at) VALUES ('c1bb3982-6792-43ab-b217-bab1724f5468', '754840d7-8b19-43bf-874b-ef7b33e1aa1f', '3b6b4d85-da92-41da-9c85-c6c2073b7ea8', 'IN_FAVOR', '1897d142-738c-43f7-acd1-81e65b37bfde', TIMESTAMP '2026-11-02 12:00:00', TIMESTAMP '2026-11-02 12:00:00');  -- Carla -> P2
INSERT INTO votes (id, user_id, proposal_id, vote_type, address_id, created_at, updated_at) VALUES ('3587a97d-90fa-4f3a-80dd-d60698cf237d', 'f9322f82-6a45-4b9b-937f-82683d3930d9', '3b6b4d85-da92-41da-9c85-c6c2073b7ea8', 'IN_FAVOR', '6f404fad-ccd5-4b1a-8c1e-0b11dc5134da', TIMESTAMP '2026-11-03 09:00:00', TIMESTAMP '2026-11-03 09:00:00');  -- Diego -> P2
INSERT INTO votes (id, user_id, proposal_id, vote_type, address_id, created_at, updated_at) VALUES ('f6d8fe7b-7472-4445-ad53-f063fa224b7a', 'fc9c42d9-8e17-4ffb-858e-4a27828f0885', '3b6b4d85-da92-41da-9c85-c6c2073b7ea8', 'AGAINST', 'edf9b3fe-442e-4aa0-8d4a-f69455e28a73', TIMESTAMP '2026-11-03 19:00:00', TIMESTAMP '2026-11-03 19:00:00');  -- Gabriela -> P2
INSERT INTO votes (id, user_id, proposal_id, vote_type, address_id, created_at, updated_at) VALUES ('ca66bf85-776d-4b5c-a5a6-356bd62f28ee', '4b292ded-b5d7-4551-a806-21f7ba62e9c5', '3b6b4d85-da92-41da-9c85-c6c2073b7ea8', 'IN_FAVOR', 'da9b52b8-62c9-4d00-8bba-e10ff33acd72', TIMESTAMP '2026-11-04 08:00:00', TIMESTAMP '2026-11-04 08:00:00');  -- Elisa -> P2
INSERT INTO votes (id, user_id, proposal_id, vote_type, address_id, created_at, updated_at) VALUES ('e571fe10-c44b-4ee5-986a-8b3940847cac', '0bd69764-6100-4f99-b035-d2f3e11f2c5a', '3b6b4d85-da92-41da-9c85-c6c2073b7ea8', 'IN_FAVOR', 'ee6d0aa8-6977-4524-a4fc-2b0f28cb4ad7', TIMESTAMP '2026-11-05 10:00:00', TIMESTAMP '2026-11-05 10:00:00');  -- Felipe -> P2
INSERT INTO votes (id, user_id, proposal_id, vote_type, address_id, created_at, updated_at) VALUES ('ce11b900-a591-435e-a37b-7fe2689ded09', '71e111a9-adbb-4e38-9776-3631b9b2f3b5', '2d6e1376-26e6-4223-bbbd-5fb8e2de5bac', 'IN_FAVOR', 'b225823e-be8f-4fda-858a-07ede4310f01', TIMESTAMP '2026-09-14 10:00:00', TIMESTAMP '2026-09-14 10:00:00');  -- Ana -> P3
INSERT INTO votes (id, user_id, proposal_id, vote_type, address_id, created_at, updated_at) VALUES ('68fea60a-8d76-4f75-b15d-d1234183b7c3', 'e372b44f-6771-44bf-aabe-d3411d7f7487', '2d6e1376-26e6-4223-bbbd-5fb8e2de5bac', 'IN_FAVOR', '26104c2d-5d61-43dc-9f3e-08fa5f0750ed', TIMESTAMP '2026-09-14 14:00:00', TIMESTAMP '2026-09-14 14:00:00');  -- Bruno -> P3
INSERT INTO votes (id, user_id, proposal_id, vote_type, address_id, created_at, updated_at) VALUES ('8989e9dd-1703-44de-9350-772060db72bc', 'f9322f82-6a45-4b9b-937f-82683d3930d9', '2d6e1376-26e6-4223-bbbd-5fb8e2de5bac', 'IN_FAVOR', '6f404fad-ccd5-4b1a-8c1e-0b11dc5134da', TIMESTAMP '2026-09-15 09:00:00', TIMESTAMP '2026-09-15 09:00:00');  -- Diego -> P3
INSERT INTO votes (id, user_id, proposal_id, vote_type, address_id, created_at, updated_at) VALUES ('5d562067-63a4-457b-a11a-c5742f196e13', '4b292ded-b5d7-4551-a806-21f7ba62e9c5', '2d6e1376-26e6-4223-bbbd-5fb8e2de5bac', 'IN_FAVOR', 'da9b52b8-62c9-4d00-8bba-e10ff33acd72', TIMESTAMP '2026-09-15 18:00:00', TIMESTAMP '2026-09-15 18:00:00');  -- Elisa -> P3
INSERT INTO votes (id, user_id, proposal_id, vote_type, address_id, created_at, updated_at) VALUES ('9394735a-33f5-4cf0-ae57-987e54c79fff', 'fc9c42d9-8e17-4ffb-858e-4a27828f0885', '2d6e1376-26e6-4223-bbbd-5fb8e2de5bac', 'AGAINST', 'edf9b3fe-442e-4aa0-8d4a-f69455e28a73', TIMESTAMP '2026-09-16 08:00:00', TIMESTAMP '2026-09-16 08:00:00');  -- Gabriela -> P3
INSERT INTO votes (id, user_id, proposal_id, vote_type, address_id, created_at, updated_at) VALUES ('5b969280-1d26-4edd-bc1e-482ace9c0289', '0bd69764-6100-4f99-b035-d2f3e11f2c5a', '2d6e1376-26e6-4223-bbbd-5fb8e2de5bac', 'IN_FAVOR', 'ee6d0aa8-6977-4524-a4fc-2b0f28cb4ad7', TIMESTAMP '2026-09-17 10:00:00', TIMESTAMP '2026-09-17 10:00:00');  -- Felipe -> P3
INSERT INTO votes (id, user_id, proposal_id, vote_type, address_id, created_at, updated_at) VALUES ('92f26b6d-0cf7-4a6c-aff1-a6bbcbfa6da8', '749a6236-5948-46dc-b20b-c75dafee381b', '2d6e1376-26e6-4223-bbbd-5fb8e2de5bac', 'IN_FAVOR', '06522629-60f5-44d0-9cd8-a6085c82a973', TIMESTAMP '2026-09-18 12:00:00', TIMESTAMP '2026-09-18 12:00:00');  -- Henrique -> P3
INSERT INTO votes (id, user_id, proposal_id, vote_type, address_id, created_at, updated_at) VALUES ('f2465f13-2b11-4fe0-bff4-1f30399282fe', '4c33c062-8def-473a-bca8-d511579e6cc9', '2d6e1376-26e6-4223-bbbd-5fb8e2de5bac', 'IN_FAVOR', 'e05251ab-2842-4cc3-bd07-460f0436044d', TIMESTAMP '2026-09-20 09:00:00', TIMESTAMP '2026-09-20 09:00:00');  -- Helena -> P3
INSERT INTO votes (id, user_id, proposal_id, vote_type, address_id, created_at, updated_at) VALUES ('5add3372-9746-4d4b-8924-c839806e7567', '71e111a9-adbb-4e38-9776-3631b9b2f3b5', '298cb0f7-8414-45be-ba10-28989c91b091', 'IN_FAVOR', 'b225823e-be8f-4fda-858a-07ede4310f01', TIMESTAMP '2026-10-01 11:00:00', TIMESTAMP '2026-10-01 11:00:00');  -- Ana -> P4
INSERT INTO votes (id, user_id, proposal_id, vote_type, address_id, created_at, updated_at) VALUES ('0346034d-0868-4943-9869-c72abc5516f6', 'e372b44f-6771-44bf-aabe-d3411d7f7487', '298cb0f7-8414-45be-ba10-28989c91b091', 'AGAINST', '26104c2d-5d61-43dc-9f3e-08fa5f0750ed', TIMESTAMP '2026-10-01 16:00:00', TIMESTAMP '2026-10-01 16:00:00');  -- Bruno -> P4
INSERT INTO votes (id, user_id, proposal_id, vote_type, address_id, created_at, updated_at) VALUES ('6124491d-b1a9-4ea3-8f57-b9da8a4b9c1a', '754840d7-8b19-43bf-874b-ef7b33e1aa1f', '298cb0f7-8414-45be-ba10-28989c91b091', 'IN_FAVOR', '1897d142-738c-43f7-acd1-81e65b37bfde', TIMESTAMP '2026-10-02 09:00:00', TIMESTAMP '2026-10-02 09:00:00');  -- Carla -> P4
INSERT INTO votes (id, user_id, proposal_id, vote_type, address_id, created_at, updated_at) VALUES ('8ace7c94-3477-4a7f-888d-925589586ac4', '4b292ded-b5d7-4551-a806-21f7ba62e9c5', '298cb0f7-8414-45be-ba10-28989c91b091', 'AGAINST', 'da9b52b8-62c9-4d00-8bba-e10ff33acd72', TIMESTAMP '2026-10-02 20:00:00', TIMESTAMP '2026-10-02 20:00:00');  -- Elisa -> P4
INSERT INTO votes (id, user_id, proposal_id, vote_type, address_id, created_at, updated_at) VALUES ('13a1cf95-5fba-4f26-82ef-998137a942e6', '0bd69764-6100-4f99-b035-d2f3e11f2c5a', '298cb0f7-8414-45be-ba10-28989c91b091', 'IN_FAVOR', 'ee6d0aa8-6977-4524-a4fc-2b0f28cb4ad7', TIMESTAMP '2026-10-03 10:00:00', TIMESTAMP '2026-10-03 10:00:00');  -- Felipe -> P4
INSERT INTO votes (id, user_id, proposal_id, vote_type, address_id, created_at, updated_at) VALUES ('0d27c73d-72e4-45a2-91b8-028209c4548c', 'fc9c42d9-8e17-4ffb-858e-4a27828f0885', '298cb0f7-8414-45be-ba10-28989c91b091', 'IN_FAVOR', 'edf9b3fe-442e-4aa0-8d4a-f69455e28a73', TIMESTAMP '2026-10-04 09:00:00', TIMESTAMP '2026-10-04 09:00:00');  -- Gabriela -> P4
INSERT INTO votes (id, user_id, proposal_id, vote_type, address_id, created_at, updated_at) VALUES ('fa005d98-61ca-46fc-a8b5-e48d2d0c3914', '71e111a9-adbb-4e38-9776-3631b9b2f3b5', 'c4197a10-20b2-4ad5-933f-2ef8337565e1', 'IN_FAVOR', 'b225823e-be8f-4fda-858a-07ede4310f01', TIMESTAMP '2026-08-03 10:00:00', TIMESTAMP '2026-08-03 10:00:00');  -- Ana -> P5
INSERT INTO votes (id, user_id, proposal_id, vote_type, address_id, created_at, updated_at) VALUES ('6bd60d9f-b84b-49b2-8727-84f6ac1febe1', 'e372b44f-6771-44bf-aabe-d3411d7f7487', 'c4197a10-20b2-4ad5-933f-2ef8337565e1', 'IN_FAVOR', '26104c2d-5d61-43dc-9f3e-08fa5f0750ed', TIMESTAMP '2026-08-03 15:00:00', TIMESTAMP '2026-08-03 15:00:00');  -- Bruno -> P5
INSERT INTO votes (id, user_id, proposal_id, vote_type, address_id, created_at, updated_at) VALUES ('9bc626e6-40a6-4ee4-bb2c-7a24328e65fd', '754840d7-8b19-43bf-874b-ef7b33e1aa1f', 'c4197a10-20b2-4ad5-933f-2ef8337565e1', 'IN_FAVOR', '1897d142-738c-43f7-acd1-81e65b37bfde', TIMESTAMP '2026-08-04 09:00:00', TIMESTAMP '2026-08-04 09:00:00');  -- Carla -> P5
INSERT INTO votes (id, user_id, proposal_id, vote_type, address_id, created_at, updated_at) VALUES ('b6905e24-347f-4572-9324-6b996ee6c73d', 'f9322f82-6a45-4b9b-937f-82683d3930d9', 'c4197a10-20b2-4ad5-933f-2ef8337565e1', 'IN_FAVOR', '6f404fad-ccd5-4b1a-8c1e-0b11dc5134da', TIMESTAMP '2026-08-05 18:00:00', TIMESTAMP '2026-08-05 18:00:00');  -- Diego -> P5
INSERT INTO votes (id, user_id, proposal_id, vote_type, address_id, created_at, updated_at) VALUES ('41745425-e60c-4038-a78b-f256d8473eef', '0bd69764-6100-4f99-b035-d2f3e11f2c5a', 'c4197a10-20b2-4ad5-933f-2ef8337565e1', 'IN_FAVOR', 'ee6d0aa8-6977-4524-a4fc-2b0f28cb4ad7', TIMESTAMP '2026-08-09 11:00:00', TIMESTAMP '2026-08-09 11:00:00');  -- Felipe -> P5
INSERT INTO votes (id, user_id, proposal_id, vote_type, address_id, created_at, updated_at) VALUES ('b074ad5a-7838-434e-9784-73ba05ed9aef', '749a6236-5948-46dc-b20b-c75dafee381b', 'c4197a10-20b2-4ad5-933f-2ef8337565e1', 'AGAINST', '06522629-60f5-44d0-9cd8-a6085c82a973', TIMESTAMP '2026-08-12 09:00:00', TIMESTAMP '2026-08-12 09:00:00');  -- Henrique -> P5
INSERT INTO votes (id, user_id, proposal_id, vote_type, address_id, created_at, updated_at) VALUES ('949868f1-c237-4d99-866a-3efedaff296f', '4c33c062-8def-473a-bca8-d511579e6cc9', 'c4197a10-20b2-4ad5-933f-2ef8337565e1', 'IN_FAVOR', 'e05251ab-2842-4cc3-bd07-460f0436044d', TIMESTAMP '2026-08-14 10:00:00', TIMESTAMP '2026-08-14 10:00:00');  -- Helena -> P5
INSERT INTO votes (id, user_id, proposal_id, vote_type, address_id, created_at, updated_at) VALUES ('cb65b16c-a7f0-457e-8dbe-17ea2e032fcc', 'fc9c42d9-8e17-4ffb-858e-4a27828f0885', 'd501c4b6-ecba-4430-89a0-a40152b0d6bc', 'IN_FAVOR', 'edf9b3fe-442e-4aa0-8d4a-f69455e28a73', TIMESTAMP '2026-07-07 09:00:00', TIMESTAMP '2026-07-07 09:00:00');  -- Gabriela -> P6
INSERT INTO votes (id, user_id, proposal_id, vote_type, address_id, created_at, updated_at) VALUES ('6aa87cd6-3fa3-4c97-9eaa-406fd11bd606', '749a6236-5948-46dc-b20b-c75dafee381b', 'd501c4b6-ecba-4430-89a0-a40152b0d6bc', 'AGAINST', '06522629-60f5-44d0-9cd8-a6085c82a973', TIMESTAMP '2026-07-08 10:00:00', TIMESTAMP '2026-07-08 10:00:00');  -- Henrique -> P6

INSERT INTO official_responses (id, proposal_id, created_by, content, proposal_status, created_at, updated_at) VALUES ('d5107681-4b88-4aac-b2ca-889a8dd7f1c8', '2d6e1376-26e6-4223-bbbd-5fb8e2de5bac', '4c33c062-8def-473a-bca8-d511579e6cc9', 'A proposta foi aprovada. A Secretaria de Zeladoria vai elaborar o projeto de reforma da praça e da iluminação, com previsão de início das obras em outubro. A comunidade será consultada sobre o desenho dos bancos e do paisagismo.', 'APPROVED', TIMESTAMP '2026-09-29 14:00:00', TIMESTAMP '2026-09-29 14:00:00');  -- P3 (APPROVED)
INSERT INTO official_responses (id, proposal_id, created_by, content, proposal_status, created_at, updated_at) VALUES ('fccc04be-ae4b-475a-ac6e-a1ed6dc2bd17', '2d6e1376-26e6-4223-bbbd-5fb8e2de5bac', 'c2225dc9-96f0-4e7a-ab09-113e7f776d5f', 'As obras começaram. A troca da iluminação por LED é a primeira etapa e deve terminar em três semanas, seguida da recuperação das calçadas. O cronograma será atualizado aqui.', 'IN_PROGRESS', TIMESTAMP '2026-10-20 10:00:00', TIMESTAMP '2026-10-20 10:00:00');  -- P3 (IN_PROGRESS)
INSERT INTO official_responses (id, proposal_id, created_by, content, proposal_status, created_at, updated_at) VALUES ('97c73257-19e8-4e0a-b9bf-9e89e0297ddc', '298cb0f7-8414-45be-ba10-28989c91b091', 'c2225dc9-96f0-4e7a-ab09-113e7f776d5f', 'Após análise técnica, a proposta foi recusada. A proibição total do estacionamento prejudicaria o comércio local e os moradores sem garagem, e os estudos de tráfego indicam que a medida teria efeito limitado. A Secretaria vai estudar alternativas, como a faixa exclusiva de ônibus nos horários de pico, e convida os moradores a apresentar uma nova proposta.', 'REJECTED', TIMESTAMP '2026-10-13 15:00:00', TIMESTAMP '2026-10-13 15:00:00');  -- P4 (REJECTED)
INSERT INTO official_responses (id, proposal_id, created_by, content, proposal_status, created_at, updated_at) VALUES ('718a5c10-5a4e-4a90-a9df-69743658fbc3', 'c4197a10-20b2-4ad5-933f-2ef8337565e1', '4c33c062-8def-473a-bca8-d511579e6cc9', 'Proposta aprovada. A prefeitura vai adquirir os conjuntos de lixeiras e instalá-los nas esquinas indicadas pelos moradores.', 'APPROVED', TIMESTAMP '2026-08-25 14:00:00', TIMESTAMP '2026-08-25 14:00:00');  -- P5 (APPROVED)
INSERT INTO official_responses (id, proposal_id, created_by, content, proposal_status, created_at, updated_at) VALUES ('707c89a6-c7e3-43f2-9803-4fd9788db20b', 'c4197a10-20b2-4ad5-933f-2ef8337565e1', 'c2225dc9-96f0-4e7a-ab09-113e7f776d5f', 'As lixeiras foram instaladas nas principais esquinas e na praça. Obrigado a todos que participaram da votação.', 'COMPLETED', TIMESTAMP '2026-10-05 16:00:00', TIMESTAMP '2026-10-05 16:00:00');  -- P5 (COMPLETED)

INSERT INTO proposal_status_history (id, proposal_id, from_status, to_status, changed_by, created_at, updated_at) VALUES ('cc5cf506-3bdc-47d9-956b-e714a2a4ae58', '295234f9-f00b-4fa9-8b7c-8f1f5b63a1f6', NULL, 'COLLECTING_VOTES', '71e111a9-adbb-4e38-9776-3631b9b2f3b5', TIMESTAMP '2026-11-10 08:30:00', TIMESTAMP '2026-11-10 08:30:00');  -- P1
INSERT INTO proposal_status_history (id, proposal_id, from_status, to_status, changed_by, created_at, updated_at) VALUES ('3c7983c2-2f2a-4af0-8db4-8cd00991204a', '3b6b4d85-da92-41da-9c85-c6c2073b7ea8', NULL, 'COLLECTING_VOTES', 'e372b44f-6771-44bf-aabe-d3411d7f7487', TIMESTAMP '2026-11-02 09:15:00', TIMESTAMP '2026-11-02 09:15:00');  -- P2
INSERT INTO proposal_status_history (id, proposal_id, from_status, to_status, changed_by, created_at, updated_at) VALUES ('fa26a843-b40f-462c-a69f-dad9a19da7eb', '3b6b4d85-da92-41da-9c85-c6c2073b7ea8', 'COLLECTING_VOTES', 'AWAITING_REVIEW', NULL, TIMESTAMP '2026-11-04 08:00:00', TIMESTAMP '2026-11-04 08:00:00');  -- P2
INSERT INTO proposal_status_history (id, proposal_id, from_status, to_status, changed_by, created_at, updated_at) VALUES ('c9def670-91d7-4f57-ac40-5fb65ef2aef9', '2d6e1376-26e6-4223-bbbd-5fb8e2de5bac', NULL, 'COLLECTING_VOTES', '754840d7-8b19-43bf-874b-ef7b33e1aa1f', TIMESTAMP '2026-09-14 09:00:00', TIMESTAMP '2026-09-14 09:00:00');  -- P3
INSERT INTO proposal_status_history (id, proposal_id, from_status, to_status, changed_by, created_at, updated_at) VALUES ('b1e107de-4881-4e1f-acb6-997a5df12faa', '2d6e1376-26e6-4223-bbbd-5fb8e2de5bac', 'COLLECTING_VOTES', 'AWAITING_REVIEW', NULL, TIMESTAMP '2026-09-16 08:00:00', TIMESTAMP '2026-09-16 08:00:00');  -- P3
INSERT INTO proposal_status_history (id, proposal_id, from_status, to_status, changed_by, created_at, updated_at) VALUES ('858ac41c-0427-4432-a25f-b64474248ba3', '2d6e1376-26e6-4223-bbbd-5fb8e2de5bac', 'AWAITING_REVIEW', 'UNDER_REVIEW', '4c33c062-8def-473a-bca8-d511579e6cc9', TIMESTAMP '2026-09-22 10:00:00', TIMESTAMP '2026-09-22 10:00:00');  -- P3
INSERT INTO proposal_status_history (id, proposal_id, from_status, to_status, changed_by, created_at, updated_at) VALUES ('94806f5b-319d-4b40-9499-c41a059cad9c', '2d6e1376-26e6-4223-bbbd-5fb8e2de5bac', 'UNDER_REVIEW', 'APPROVED', '4c33c062-8def-473a-bca8-d511579e6cc9', TIMESTAMP '2026-09-29 14:00:00', TIMESTAMP '2026-09-29 14:00:00');  -- P3
INSERT INTO proposal_status_history (id, proposal_id, from_status, to_status, changed_by, created_at, updated_at) VALUES ('786ea390-823a-4523-b193-c322a81211f1', '2d6e1376-26e6-4223-bbbd-5fb8e2de5bac', 'APPROVED', 'IN_PROGRESS', 'c2225dc9-96f0-4e7a-ab09-113e7f776d5f', TIMESTAMP '2026-10-20 10:00:00', TIMESTAMP '2026-10-20 10:00:00');  -- P3
INSERT INTO proposal_status_history (id, proposal_id, from_status, to_status, changed_by, created_at, updated_at) VALUES ('a77762c3-dea3-47c1-8fa1-65db98898999', '298cb0f7-8414-45be-ba10-28989c91b091', NULL, 'COLLECTING_VOTES', 'f9322f82-6a45-4b9b-937f-82683d3930d9', TIMESTAMP '2026-10-01 10:00:00', TIMESTAMP '2026-10-01 10:00:00');  -- P4
INSERT INTO proposal_status_history (id, proposal_id, from_status, to_status, changed_by, created_at, updated_at) VALUES ('b01086b2-1f37-47fe-8050-1599cc40d8cb', '298cb0f7-8414-45be-ba10-28989c91b091', 'COLLECTING_VOTES', 'AWAITING_REVIEW', NULL, TIMESTAMP '2026-10-03 10:00:00', TIMESTAMP '2026-10-03 10:00:00');  -- P4
INSERT INTO proposal_status_history (id, proposal_id, from_status, to_status, changed_by, created_at, updated_at) VALUES ('12a69851-05e8-48d3-9d75-1762fbac61c5', '298cb0f7-8414-45be-ba10-28989c91b091', 'AWAITING_REVIEW', 'UNDER_REVIEW', 'c2225dc9-96f0-4e7a-ab09-113e7f776d5f', TIMESTAMP '2026-10-08 09:00:00', TIMESTAMP '2026-10-08 09:00:00');  -- P4
INSERT INTO proposal_status_history (id, proposal_id, from_status, to_status, changed_by, created_at, updated_at) VALUES ('72a4c9b6-a1de-4e38-b29e-7d61fdaaf240', '298cb0f7-8414-45be-ba10-28989c91b091', 'UNDER_REVIEW', 'REJECTED', 'c2225dc9-96f0-4e7a-ab09-113e7f776d5f', TIMESTAMP '2026-10-13 15:00:00', TIMESTAMP '2026-10-13 15:00:00');  -- P4
INSERT INTO proposal_status_history (id, proposal_id, from_status, to_status, changed_by, created_at, updated_at) VALUES ('e222373d-9a5b-4541-ae84-97e520fa5f84', 'c4197a10-20b2-4ad5-933f-2ef8337565e1', NULL, 'COLLECTING_VOTES', '4b292ded-b5d7-4551-a806-21f7ba62e9c5', TIMESTAMP '2026-08-03 09:30:00', TIMESTAMP '2026-08-03 09:30:00');  -- P5
INSERT INTO proposal_status_history (id, proposal_id, from_status, to_status, changed_by, created_at, updated_at) VALUES ('27ce037e-24ba-4370-8634-6c9bc3572e00', 'c4197a10-20b2-4ad5-933f-2ef8337565e1', 'COLLECTING_VOTES', 'AWAITING_REVIEW', NULL, TIMESTAMP '2026-08-09 11:00:00', TIMESTAMP '2026-08-09 11:00:00');  -- P5
INSERT INTO proposal_status_history (id, proposal_id, from_status, to_status, changed_by, created_at, updated_at) VALUES ('927701f7-c09d-4832-9f29-1712b41aba6a', 'c4197a10-20b2-4ad5-933f-2ef8337565e1', 'AWAITING_REVIEW', 'UNDER_REVIEW', 'c2225dc9-96f0-4e7a-ab09-113e7f776d5f', TIMESTAMP '2026-08-18 10:00:00', TIMESTAMP '2026-08-18 10:00:00');  -- P5
INSERT INTO proposal_status_history (id, proposal_id, from_status, to_status, changed_by, created_at, updated_at) VALUES ('59f17bc3-5bf4-469a-9da9-5c399cbc0305', 'c4197a10-20b2-4ad5-933f-2ef8337565e1', 'UNDER_REVIEW', 'APPROVED', '4c33c062-8def-473a-bca8-d511579e6cc9', TIMESTAMP '2026-08-25 14:00:00', TIMESTAMP '2026-08-25 14:00:00');  -- P5
INSERT INTO proposal_status_history (id, proposal_id, from_status, to_status, changed_by, created_at, updated_at) VALUES ('c79b94c8-6012-45d0-9275-90469856cf22', 'c4197a10-20b2-4ad5-933f-2ef8337565e1', 'APPROVED', 'IN_PROGRESS', 'c2225dc9-96f0-4e7a-ab09-113e7f776d5f', TIMESTAMP '2026-09-02 09:00:00', TIMESTAMP '2026-09-02 09:00:00');  -- P5
INSERT INTO proposal_status_history (id, proposal_id, from_status, to_status, changed_by, created_at, updated_at) VALUES ('b52a2aad-937e-43e1-97b7-1a16cf397a3c', 'c4197a10-20b2-4ad5-933f-2ef8337565e1', 'IN_PROGRESS', 'COMPLETED', 'c2225dc9-96f0-4e7a-ab09-113e7f776d5f', TIMESTAMP '2026-10-05 16:00:00', TIMESTAMP '2026-10-05 16:00:00');  -- P5
INSERT INTO proposal_status_history (id, proposal_id, from_status, to_status, changed_by, created_at, updated_at) VALUES ('074fa14f-222c-41c4-a3e5-82e189c50ab3', 'd501c4b6-ecba-4430-89a0-a40152b0d6bc', NULL, 'COLLECTING_VOTES', '0bd69764-6100-4f99-b035-d2f3e11f2c5a', TIMESTAMP '2026-07-06 11:00:00', TIMESTAMP '2026-07-06 11:00:00');  -- P6

COMMIT;