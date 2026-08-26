from tortoise import fields, models

class Usuario(models.Model):
    id = fields.IntField(pk=True)
    ativo = fields.BooleanField(null=False, default=True)
    nome = fields.CharField(null=False, max_length=60)
    email = fields.CharField(null=False, max_length=100)
    senha = fields.CharField(null=False, max_length=60)
    foto = fields.CharField(null=True, max_length=100)
    
    grupo_acesso = fields.ManyToManyField(
        "models.GrupoAcesso", 
        related_name="usuarios_grupos_acesso"
    ) 
    organizacao = fields.ForeignKeyField(
        'models.Organizacao', 
        related_name='usuarios_organizacao',
        on_delete=fields.CASCADE
    )

    class Meta:
        table = "usuario"