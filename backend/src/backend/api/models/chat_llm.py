from tortoise import fields, models

class ChatLLM(models.Model):
    id = fields.IntField(pk=True)
    titulo = fields.CharField(null=False, max_length=60)
    historico = fields.JSONField(null=False)
    
    usuario = fields.ForeignKeyField(
        'models.Usuario', 
        related_name='chats_llm_usuario',
        on_delete=fields.CASCADE,
        null=True # TODO settar False quando estiver implementado (usuários)
    )

    class Meta:
        table = "chat_llm"