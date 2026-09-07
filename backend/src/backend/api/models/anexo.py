from tortoise import fields, models


class Anexo(models.Model):
    id = fields.IntField(pk=True)
    nome = fields.CharField(max_length=255)
    extensao = fields.CharField(max_length=4)
    mensagem = fields.ForeignKeyField(
        'models.Mensagem', related_name='anexos', on_delete=fields.CASCADE,
    )

    class Meta:
        table = 'anexo'
