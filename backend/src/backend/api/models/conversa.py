from tortoise import fields, models


class Conversa(models.Model):
    id = fields.IntField(pk=True)
    titulo = fields.CharField(max_length=255)
    usuario = fields.ForeignKeyField(
        'models.Usuario', related_name='conversas', on_delete=fields.CASCADE,
    )
    data_criacao = fields.DatetimeField(auto_now_add=True)
    data_ultima_interacao = fields.DatetimeField(auto_now_add=True)

    class Meta:
        table = 'conversa'
