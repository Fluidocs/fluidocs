from enum import StrEnum

from tortoise import fields, models


class PapelMensagem(StrEnum):
    USUARIO = 'U'
    ASSISTENTE = 'A'


class Mensagem(models.Model):
    id = fields.IntField(pk=True)
    conteudo = fields.TextField()
    papel = fields.CharEnumField(PapelMensagem, max_length=1)
    data_envio = fields.DatetimeField(auto_now_add=True)
    conversa = fields.ForeignKeyField(
        'models.Conversa', related_name='mensagens', on_delete=fields.CASCADE,
    )

    class Meta:
        table = 'mensagem'
