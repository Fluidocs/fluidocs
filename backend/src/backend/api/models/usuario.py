from tortoise import fields, models

class Usuario(models.Model):
    id = fields.IntField(pk=True)
    nome = fields.CharField(null=False, max_length=60)
    email = fields.CharField(null=False, max_length=100, unique=True)
    senha = fields.CharField(null=False, max_length=255)
    foto_perfil = fields.CharField(null=True, max_length=255)
    limite_chaves_api = fields.IntField(null=False, default=5)
    data_criacao = fields.DatetimeField(auto_now_add=True)
    data_atualizacao = fields.DatetimeField(auto_now=True)
    comportamento_ia = fields.TextField(null=True)

    class Meta:
        table = "usuario"
