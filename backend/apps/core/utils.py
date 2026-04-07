import re

from apps.core.models import AuditLog


def only_digits(value):
    return re.sub(r"\D", "", value or "")


def validate_cpf(value):
    digits = only_digits(value)
    if len(digits) != 11 or digits == digits[0] * 11:
        return False
    total = sum(int(digits[i]) * (10 - i) for i in range(9))
    remainder = (total * 10) % 11
    first_digit = 0 if remainder == 10 else remainder
    if first_digit != int(digits[9]):
        return False
    total = sum(int(digits[i]) * (11 - i) for i in range(10))
    remainder = (total * 10) % 11
    second_digit = 0 if remainder == 10 else remainder
    return second_digit == int(digits[10])


def validate_cnpj(value):
    digits = only_digits(value)
    if len(digits) != 14 or digits == digits[0] * 14:
        return False
    weights_1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    weights_2 = [6] + weights_1
    total = sum(int(digits[i]) * weights_1[i] for i in range(12))
    remainder = total % 11
    first_digit = 0 if remainder < 2 else 11 - remainder
    if first_digit != int(digits[12]):
        return False
    total = sum(int(digits[i]) * weights_2[i] for i in range(13))
    remainder = total % 11
    second_digit = 0 if remainder < 2 else 11 - remainder
    return second_digit == int(digits[13])


def validate_document(value):
    digits = only_digits(value)
    if not digits:
        return True
    if len(digits) == 11:
        return validate_cpf(digits)
    if len(digits) == 14:
        return validate_cnpj(digits)
    return False


def create_audit_log(actor, action, entity, entity_id, description):
    AuditLog.objects.create(
        actor=actor if getattr(actor, "is_authenticated", False) else None,
        action=action,
        entity=entity,
        entity_id=entity_id,
        description=description,
    )
