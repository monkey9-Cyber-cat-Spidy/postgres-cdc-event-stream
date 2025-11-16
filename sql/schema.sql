-- PostgreSQL Native Notification CDC Architecture
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Business Orders Table Tracked by CDC
CREATE TABLE IF NOT EXISTS customer_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_name VARCHAR(128) NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'created',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Trigger Function Broadcasting JSON Event via pg_notify
CREATE OR REPLACE FUNCTION notify_cdc_mutation()
RETURNS TRIGGER AS $$
DECLARE
    payload JSONB;
BEGIN
    payload = jsonb_build_object(
        'table', TG_TABLE_NAME,
        'action', TG_OP,
        'record_id', COALESCE(NEW.id, OLD.id),
        'old', to_jsonb(OLD),
        'new', to_jsonb(NEW),
        'timestamp', CURRENT_TIMESTAMP
    );

    PERFORM pg_notify('cdc_events_stream', payload::TEXT);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_customer_orders_cdc ON customer_orders;
CREATE TRIGGER trg_customer_orders_cdc
AFTER INSERT OR UPDATE OR DELETE ON customer_orders
FOR EACH ROW EXECUTE FUNCTION notify_cdc_mutation();
